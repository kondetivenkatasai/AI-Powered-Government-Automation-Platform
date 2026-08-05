from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import VerificationReport, Application, User, UserRole
from app.services.ai_pipeline import ai_pipeline
from app.api.deps import get_current_user

router = APIRouter()

@router.post("/{application_id}/analyze")
def trigger_ai_analysis(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Trigger complete 7-stage AI OCR, expected document type, and fraud analysis."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    try:
        report = ai_pipeline.process_application(db, application_id)
        return {
            "message": "AI Verification Pipeline executed successfully",
            "application_id": application_id,
            "confidence_score": float(report.confidence_score),
            "risk_score": float(report.risk_score),
            "fraud_score": float(report.fraud_score or 0.0),
            "recommendation": report.recommendation,
            "summary": report.summary,
            "document_verifications": report.document_verifications or []
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/{application_id}/report")
def get_verification_report(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve AI multi-stage verification report for an application."""
    report = db.query(VerificationReport).filter(VerificationReport.application_id == application_id).first()
    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification report not generated yet.")

    return {
        "id": report.id,
        "application_id": report.application_id,
        "confidence_score": float(report.confidence_score),
        "risk_score": float(report.risk_score),
        "fraud_score": float(report.fraud_score or 0.0),
        "recommendation": report.recommendation,
        "summary": report.summary,
        "discrepancies": report.discrepancies or [],
        "eligibility_checks": report.eligibility_checks or [],
        "fraud_flags": report.fraud_flags or [],
        "document_verifications": report.document_verifications or [],
        "is_duplicate": report.is_duplicate,
        "created_at": report.created_at
    }
