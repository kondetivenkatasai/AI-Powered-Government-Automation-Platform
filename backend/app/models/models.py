import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Numeric, Enum, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class UserRole(str, enum.Enum):
    CITIZEN = "CITIZEN"
    OFFICER = "OFFICER"
    ADMINISTRATOR = "ADMINISTRATOR"

class ApplicationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    PROCESSING = "PROCESSING"
    NEEDS_MANUAL_REVIEW = "NEEDS_MANUAL_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class RecommendationType(str, enum.Enum):
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    MANUAL_REVIEW = "MANUAL_REVIEW"

class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(20), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    users = relationship("User", back_populates="department")
    application_types = relationship("ApplicationType", back_populates="department")
    applications = relationship("Application", back_populates="department")

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), nullable=False, unique=True, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=True)
    role = Column(String(30), default=UserRole.CITIZEN.value, nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    department = relationship("Department", back_populates="users")
    applications = relationship("Application", back_populates="applicant", foreign_keys="Application.applicant_id")
    assigned_applications = relationship("Application", back_populates="assigned_officer", foreign_keys="Application.assigned_officer_id")

class ApplicationType(Base):
    __tablename__ = "application_types"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    title = Column(String(150), nullable=False)
    code = Column(String(50), nullable=False, unique=True)
    required_documents = Column(JSON, nullable=False, default=list) # List of required doc types
    eligibility_rules = Column(JSON, nullable=False, default=dict) # Rule definition object
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    department = relationship("Department", back_populates="application_types")
    applications = relationship("Application", back_populates="application_type")

class Application(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_number = Column(String(50), nullable=False, unique=True, index=True)
    applicant_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    application_type_id = Column(String(36), ForeignKey("application_types.id"), nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id"), nullable=False)
    status = Column(String(30), default=ApplicationStatus.SUBMITTED.value, nullable=False)
    form_data = Column(JSON, nullable=False, default=dict)
    assigned_officer_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    decision_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    applicant = relationship("User", foreign_keys=[applicant_id], back_populates="applications")
    assigned_officer = relationship("User", foreign_keys=[assigned_officer_id], back_populates="assigned_applications")
    application_type = relationship("ApplicationType", back_populates="applications")
    department = relationship("Department", back_populates="applications")
    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    verification_report = relationship("VerificationReport", uselist=False, back_populates="application", cascade="all, delete-orphan")
    certificate = relationship("Certificate", uselist=False, back_populates="application", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False)
    document_type = Column(String(50), nullable=False) # e.g. 'Aadhaar Card', 'Income Proof'
    expected_type = Column(String(100), nullable=True)
    detected_type = Column(String(100), nullable=True)
    classification_confidence = Column(Numeric(5, 2), default=0.0)
    mandatory_fields_status = Column(JSON, default=dict)
    file_path = Column(String(500), nullable=False)
    file_hash = Column(String(64), nullable=False)
    ocr_raw_text = Column(Text, nullable=True)
    extracted_entities = Column(JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    application = relationship("Application", back_populates="documents")

class VerificationReport(Base):
    __tablename__ = "verification_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, unique=True)
    confidence_score = Column(Numeric(5, 2), nullable=False, default=0.0) # 0 to 100
    risk_score = Column(Numeric(5, 2), nullable=False, default=0.0)       # 0 to 100
    fraud_score = Column(Numeric(5, 2), nullable=False, default=0.0)      # 0 to 100
    recommendation = Column(String(30), default=RecommendationType.MANUAL_REVIEW.value, nullable=False)
    summary = Column(Text, nullable=False)
    discrepancies = Column(JSON, nullable=False, default=list)
    eligibility_checks = Column(JSON, nullable=False, default=list)
    fraud_flags = Column(JSON, nullable=False, default=list)
    document_verifications = Column(JSON, nullable=False, default=list) # Details per uploaded doc
    is_duplicate = Column(Boolean, default=False)
    duplicate_application_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    application = relationship("Application", back_populates="verification_report")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=True)
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    details = Column(JSON, nullable=True, default=dict)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, unique=True)
    certificate_number = Column(String(100), nullable=False, unique=True)
    digital_signature = Column(String(500), nullable=False)
    qr_code_data = Column(Text, nullable=False)
    pdf_path = Column(String(500), nullable=False)
    issued_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    application = relationship("Application", back_populates="certificate")
