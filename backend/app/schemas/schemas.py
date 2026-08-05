from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.models.models import UserRole, ApplicationStatus, RecommendationType

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    phone_number: Optional[str] = None
    role: Optional[UserRole] = UserRole.CITIZEN
    department_id: Optional[str] = None

class UserOut(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    role: UserRole
    department_id: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Department Schemas
class DepartmentOut(BaseModel):
    id: str
    name: str
    code: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

# Application Type Schemas
class ApplicationTypeOut(BaseModel):
    id: str
    department_id: str
    title: str
    code: str
    required_documents: List[str]
    eligibility_rules: Dict[str, Any]
    department_name: Optional[str] = None

    class Config:
        from_attributes = True

# Document Schemas
class DocumentOut(BaseModel):
    id: str
    application_id: str
    document_type: str
    expected_type: Optional[str] = None
    detected_type: Optional[str] = None
    classification_confidence: Optional[float] = 0.0
    mandatory_fields_status: Optional[Dict[str, Any]] = None
    file_path: str
    file_hash: str
    ocr_raw_text: Optional[str] = None
    extracted_entities: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Application Schemas
class ApplicationCreate(BaseModel):
    application_type_id: str
    form_data: Dict[str, Any]

class ApplicationStatusUpdate(BaseModel):
    status: str
    rejection_reason: Optional[str] = None

class ApplicationOut(BaseModel):
    id: str
    application_number: str
    applicant_id: str
    application_type_id: str
    department_id: str
    status: str
    form_data: Dict[str, Any]
    assigned_officer_id: Optional[str] = None
    decision_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    documents: List[DocumentOut] = []
    application_type_title: Optional[str] = None
    department_name: Optional[str] = None

    class Config:
        from_attributes = True

# Response Helper
class ResponseMessage(BaseModel):
    message: str
    success: bool = True
