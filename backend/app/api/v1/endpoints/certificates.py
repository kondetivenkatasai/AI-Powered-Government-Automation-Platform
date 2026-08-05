from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Certificate, Application, User, ApplicationType, Department
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/{application_id}")
def get_certificate(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve digital certificate details for an approved application."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if app.applicant_id != current_user.id and current_user.role not in ["OFFICER", "ADMINISTRATOR"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    cert = db.query(Certificate).filter(Certificate.application_id == application_id).first()
    if not cert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not generated yet. Application must be APPROVED.")

    app_type = db.query(ApplicationType).filter(ApplicationType.id == app.application_type_id).first()
    dept = db.query(Department).filter(Department.id == app.department_id).first()
    applicant = db.query(User).filter(User.id == app.applicant_id).first()

    return {
        "id": cert.id,
        "certificate_number": cert.certificate_number,
        "application_number": app.application_number,
        "title": app_type.title if app_type else "Government Certificate",
        "department_name": dept.name if dept else "Government Authority",
        "applicant_name": applicant.full_name if applicant else "N/A",
        "digital_signature": cert.digital_signature,
        "qr_code_data": cert.qr_code_data,
        "issued_at": cert.issued_at,
        "form_data": app.form_data
    }

@router.get("/verify/{certificate_number}")
def public_verify_certificate(
    certificate_number: str,
    db: Session = Depends(get_db)
) -> Any:
    """Public verification endpoint to validate certificate authenticity via QR code scanning."""
    cert = db.query(Certificate).filter(Certificate.certificate_number == certificate_number).first()
    if not cert:
        return {
            "valid": False,
            "message": "Invalid or forged certificate number"
        }

    app = db.query(Application).filter(Application.id == cert.application_id).first()
    app_type = db.query(ApplicationType).filter(ApplicationType.id == app.application_type_id).first()
    applicant = db.query(User).filter(User.id == app.applicant_id).first()

    return {
        "valid": True,
        "certificate_number": cert.certificate_number,
        "title": app_type.title if app_type else "Government Service",
        "applicant_name": applicant.full_name if applicant else "N/A",
        "digital_signature": cert.digital_signature,
        "issued_at": cert.issued_at,
        "verification_status": "AUTHENTIC & VERIFIED BY GOVFLOW AI"
    }
