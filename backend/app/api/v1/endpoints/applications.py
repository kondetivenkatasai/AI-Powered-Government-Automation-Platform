import os
import uuid
import hashlib
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Application, Document, ApplicationType, Department
from app.schemas.schemas import ApplicationCreate, ApplicationOut, ApplicationStatusUpdate
from app.services.document_classifier import document_classifier
from app.services.ai_pipeline import ai_pipeline

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/types", response_model=List[dict])
def get_application_types(db: Session = Depends(get_db)):
    """Retrieve all available government application types with required documents."""
    types = db.query(ApplicationType).all()
    results = []
    for t in types:
        dept = db.query(Department).filter(Department.id == t.department_id).first()
        results.append({
            "id": t.id,
            "code": t.code,
            "title": t.title,
            "description": t.title,
            "department_id": t.department_id,
            "department_name": dept.name if dept else "General Department",
            "required_documents": t.required_documents or [],
            "sla_hours": 24,
            "is_active": True
        })
    return results

@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
def create_application(
    app_in: ApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Initialize new application draft for citizen."""
    app_type = db.query(ApplicationType).filter(ApplicationType.id == app_in.application_type_id).first()
    if not app_type:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application type not found")

    import random
    import string
    random_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    app_number = f"GF-2026-{random_code}"

    application = Application(
        application_number=app_number,
        applicant_id=current_user.id,
        application_type_id=app_type.id,
        department_id=app_type.department_id,
        status="DRAFT",
        form_data=app_in.form_data or {}
    )

    db.add(application)
    db.commit()
    db.refresh(application)

    docs = db.query(Document).filter(Document.application_id == application.id).all()
    dept = db.query(Department).filter(Department.id == application.department_id).first()

    return {
        **application.__dict__,
        "documents": docs,
        "application_type_title": app_type.title,
        "department_name": dept.name if dept else "General Department"
    }

@router.post("/{application_id}/batch-upload-intake")
async def batch_upload_document_intake(
    application_id: str,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Independent Multi-File Parallel Intake & Cross-Verification Pipeline.
    Compares applicant form details (applicant_name, dob) against uploaded document OCR text.
    """
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    app_type = db.query(ApplicationType).filter(ApplicationType.id == application.application_type_id).first()
    required_slots = app_type.required_documents if app_type else []

    files_data = []
    for f in files:
        contents = await f.read()
        files_data.append((f.filename, contents))

    applicant_data = application.form_data or {}
    intake_result = document_classifier.process_batch_intake(files_data, required_slots, applicant_data=applicant_data)

    # Save accepted files and create Document DB records
    for acc in intake_result["accepted_files"]:
        mapped_slot = acc["mapped_slot"]
        contents = [c for fn, c in files_data if fn == acc["filename"]][0]

        file_hash = hashlib.sha256(contents).hexdigest()
        file_ext = os.path.splitext(acc["filename"])[1] or ".pdf"
        file_name = f"{application_id}_{mapped_slot}_{uuid.uuid4().hex[:4]}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, file_name)

        with open(file_path, "wb") as out_f:
            out_f.write(contents)

        doc = Document(
            application_id=application_id,
            document_type=mapped_slot,
            expected_type=mapped_slot.replace("_", " ").title(),
            detected_type=acc["detected_type"],
            classification_confidence=acc["confidence"],
            file_path=file_path,
            file_hash=file_hash,
            ocr_raw_text=acc.get("ocr_raw_text"),
            extracted_entities=acc.get("ocr_extracted_fields")
        )
        db.add(doc)

    db.commit()

    try:
        report = ai_pipeline.process_application(db, application_id)
        if report and intake_result.get("ai_summary"):
            intake_result["ai_summary"]["recommendation"] = report.recommendation
            intake_result["ai_summary"]["fraud_risk"] = float(report.fraud_score or 0.0)
            intake_result["ai_summary"]["ocr_accuracy"] = float(report.confidence_score or 0.0)
            intake_result["ai_summary"]["summary"] = report.summary
            if report.recommendation == "REJECT":
                intake_result["intake_success"] = False
    except Exception as e:
        print(f"AI batch processing note: {e}")

    return {
        "intake_success": intake_result["intake_success"],
        "overall_verification_progress": intake_result["overall_verification_progress"],
        "required_documents": intake_result["required_documents"],
        "uploaded_analysis": intake_result["uploaded_analysis"],
        "missing_documents": intake_result["missing_documents"],
        "ai_summary": intake_result["ai_summary"]
    }

@router.post("/{application_id}/upload-doc")
async def upload_application_document(
    application_id: str,
    background_tasks: BackgroundTasks,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Single document upload endpoint with pre-OCR verification."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    contents = await file.read()
    pre_val = document_classifier.validate_pre_ocr(contents, file.filename, document_type)
    if not pre_val["valid"]:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "status": "rejected",
                "expected": pre_val["expected"],
                "detected": pre_val["detected"],
                "confidence": pre_val["confidence"],
                "reason": pre_val["reason"]
            }
        )

    file_hash = hashlib.sha256(contents).hexdigest()
    file_ext = os.path.splitext(file.filename)[1] or ".pdf"
    file_name = f"{application_id}_{document_type}_{uuid.uuid4().hex[:4]}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)

    with open(file_path, "wb") as f:
        f.write(contents)

    doc = Document(
        application_id=application_id,
        document_type=document_type,
        expected_type=pre_val["expected"],
        detected_type=pre_val["detected"],
        classification_confidence=pre_val["confidence"],
        file_path=file_path,
        file_hash=file_hash
    )

    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        ai_pipeline.process_application(db, application_id)
    except Exception as e:
        print(f"AI processing note: {e}")

    return {
        "id": doc.id,
        "application_id": doc.application_id,
        "document_type": doc.document_type,
        "expected_type": doc.expected_type,
        "detected_type": doc.detected_type,
        "classification_confidence": float(doc.classification_confidence or 0.0),
        "file_path": doc.file_path,
        "file_hash": doc.file_hash,
        "created_at": doc.created_at
    }

@router.get("/my-applications", response_model=List[ApplicationOut])
def get_my_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get all applications submitted by the current citizen."""
    apps = db.query(Application).filter(Application.applicant_id == current_user.id).order_by(Application.created_at.desc()).all()
    results = []
    for app in apps:
        app_type = db.query(ApplicationType).filter(ApplicationType.id == app.application_type_id).first()
        dept = db.query(Department).filter(Department.id == app.department_id).first()
        docs = db.query(Document).filter(Document.application_id == app.id).all()

        results.append({
            **app.__dict__,
            "documents": docs,
            "application_type_title": app_type.title if app_type else "Service Application",
            "department_name": dept.name if dept else "General Department"
        })
    return results

@router.get("/{application_id}", response_model=ApplicationOut)
def get_application_details(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve full application details by ID."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    app_type = db.query(ApplicationType).filter(ApplicationType.id == app.application_type_id).first()
    dept = db.query(Department).filter(Department.id == app.department_id).first()
    docs = db.query(Document).filter(Document.application_id == app.id).all()

    return {
        **app.__dict__,
        "documents": docs,
        "application_type_title": app_type.title if app_type else "Service Application",
        "department_name": dept.name if dept else "General Department"
    }

@router.patch("/{application_id}/status")
def update_application_status(
    application_id: str,
    status_update: ApplicationStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Officer endpoint to approve or reject application."""
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    app.status = status_update.status
    if status_update.rejection_reason:
        app.rejection_reason = status_update.rejection_reason

    db.commit()
    db.refresh(app)
    return {"status": app.status, "message": "Application status updated successfully"}

@router.delete("/{application_id}", status_code=status.HTTP_200_OK)
def delete_application(
    application_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Delete rejected, in-review, or draft applications.
    Approved certificates are protected to preserve digital audit trails.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    if app.applicant_id != current_user.id and current_user.role != "ADMINISTRATOR":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this application")

    if app.status == "APPROVED":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Approved applications cannot be deleted.")

    db.query(Document).filter(Document.application_id == application_id).delete()
    db.delete(app)
    db.commit()
    return {"message": "Application deleted successfully"}
