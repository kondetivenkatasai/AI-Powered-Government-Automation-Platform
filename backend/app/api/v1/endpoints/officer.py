import uuid
from typing import List, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import (
    Application, ApplicationType, Department, Document, VerificationReport,
    User, UserRole, ApplicationStatus, AuditLog, Certificate
)
from app.schemas.schemas import ApplicationOut, DocumentOut
from app.api.deps import get_current_user, RoleChecker

router = APIRouter()

class OfficerDecisionPayload(BaseModel):
    decision: str # 'APPROVED' or 'REJECTED'
    decision_reason: str

@router.get("/applications")
def get_officer_applications(
    status_filter: Optional[str] = None,
    current_user: User = Depends(RoleChecker([UserRole.OFFICER, UserRole.ADMINISTRATOR])),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve applications routed to the officer's department."""
    query = db.query(Application)
    
    if current_user.role == UserRole.OFFICER.value and current_user.department_id:
        query = query.filter(Application.department_id == current_user.department_id)

    if status_filter:
        query = query.filter(Application.status == status_filter)

    apps = query.order_by(Application.created_at.desc()).all()
    results = []

    for app in apps:
        app_type = db.query(ApplicationType).filter(ApplicationType.id == app.application_type_id).first()
        dept = db.query(Department).filter(Department.id == app.department_id).first()
        report = db.query(VerificationReport).filter(VerificationReport.application_id == app.id).first()
        docs = db.query(Document).filter(Document.application_id == app.id).all()
        applicant = db.query(User).filter(User.id == app.applicant_id).first()

        results.append({
            "id": app.id,
            "application_number": app.application_number,
            "applicant_name": applicant.full_name if applicant else "N/A",
            "applicant_email": applicant.email if applicant else "N/A",
            "application_type_title": app_type.title if app_type else "Service Application",
            "department_name": dept.name if dept else "General Department",
            "status": app.status,
            "form_data": app.form_data,
            "created_at": app.created_at,
            "documents_count": len(docs),
            "documents": [
                {
                    "id": d.id,
                    "document_type": d.document_type,
                    "expected_type": d.expected_type,
                    "detected_type": d.detected_type,
                    "classification_confidence": float(d.classification_confidence or 0.0),
                    "mandatory_fields_status": d.mandatory_fields_status or {},
                    "file_hash": d.file_hash
                } for d in docs
            ],
            "verification_report": {
                "confidence_score": float(report.confidence_score) if report else 0.0,
                "risk_score": float(report.risk_score) if report else 0.0,
                "fraud_score": float(report.fraud_score or 0.0) if report else 0.0,
                "recommendation": report.recommendation if report else "NEEDS_MANUAL_REVIEW",
                "summary": report.summary if report else "Pending AI Verification",
                "discrepancies": report.discrepancies if report else [],
                "fraud_flags": report.fraud_flags if report else [],
                "eligibility_checks": report.eligibility_checks if report else [],
                "document_verifications": report.document_verifications if report else []
            } if report else None
        })

    return results

@router.post("/applications/{application_id}/decision")
def make_officer_decision(
    application_id: str,
    payload: OfficerDecisionPayload,
    current_user: User = Depends(RoleChecker([UserRole.OFFICER, UserRole.ADMINISTRATOR])),
    db: Session = Depends(get_db)
) -> Any:
    """Submit officer approval or rejection decision and trigger certificate generation."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if payload.decision not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid decision. Must be APPROVED or REJECTED.")

    app.status = payload.decision
    app.assigned_officer_id = current_user.id
    app.decision_reason = payload.decision_reason

    audit = AuditLog(
        application_id=app.id,
        actor_id=current_user.id,
        action=f"OFFICER_{payload.decision}",
        details={
            "officer_name": current_user.full_name,
            "decision": payload.decision,
            "reason": payload.decision_reason
        }
    )
    db.add(audit)

    cert_info = None
    if payload.decision == "APPROVED":
        cert_number = f"CERT-{app.application_number.replace('GF-', '')}-{uuid.uuid4().hex[:4].upper()}"
        digital_sig = f"SHA256:{uuid.uuid4().hex}{uuid.uuid4().hex}"
        qr_data = f"https://govflow.gov/verify/{cert_number}"

        cert = db.query(Certificate).filter(Certificate.application_id == app.id).first()
        if not cert:
            cert = Certificate(
                application_id=app.id,
                certificate_number=cert_number,
                digital_signature=digital_sig,
                qr_code_data=qr_data,
                pdf_path=f"certificates/{cert_number}.pdf"
            )
            db.add(cert)
            db.flush()
        
        cert_info = {
            "certificate_number": cert.certificate_number,
            "digital_signature": cert.digital_signature,
            "qr_code_data": cert.qr_code_data
        }

    db.commit()

    return {
        "message": f"Application successfully {payload.decision.lower()} by Officer {current_user.full_name}",
        "application_id": app.id,
        "status": app.status,
        "certificate": cert_info
    }
