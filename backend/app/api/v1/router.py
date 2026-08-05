from fastapi import APIRouter
from app.api.v1.endpoints import auth, applications, verification, officer, certificates, analytics

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & RBAC"])
api_router.include_router(applications.router, prefix="/applications", tags=["Applications & Submission Engine"])
api_router.include_router(verification.router, prefix="/verification", tags=["AI Processing & Verification Engine"])
api_router.include_router(officer.router, prefix="/officer", tags=["Officer Approval Workstation"])
api_router.include_router(certificates.router, prefix="/certificates", tags=["Digital Certificate Engine"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["System Analytics & Audit Engine"])
