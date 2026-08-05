import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models.models import Department, User, UserRole, ApplicationType
from app.core.security import get_password_hash

def seed_database():
    # Recreate tables to reflect updated forensic columns
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Create Departments
        depts_data = [
            {"name": "Department of Revenue & Land Records", "code": "REV", "description": "Handles land titles, income certificates, and property verification."},
            {"name": "Department of Transport & Licensing", "code": "TRN", "description": "Handles driving licenses, vehicle registrations, and permits."},
            {"name": "Civil Supplies & Ration Services", "code": "SUP", "description": "Handles ration cards, food subsidy eligibility, and household permits."}
        ]

        dept_map = {}
        for d_data in depts_data:
            existing = db.query(Department).filter(Department.code == d_data["code"]).first()
            if not existing:
                dept = Department(name=d_data["name"], code=d_data["code"], description=d_data["description"])
                db.add(dept)
                db.flush()
                dept_map[d_data["code"]] = dept
            else:
                dept_map[d_data["code"]] = existing

        # 2. Create Application Types
        app_types = [
            {
                "title": "Income Certificate",
                "code": "INC_CERT",
                "department_id": dept_map["REV"].id,
                "required_documents": ["IDENTITY_PROOF", "INCOME_PROOF", "ADDRESS_PROOF"],
                "eligibility_rules": {"max_annual_income": 300000, "min_age": 18}
            },
            {
                "title": "Commercial Driving License",
                "code": "DL_COMM",
                "department_id": dept_map["TRN"].id,
                "required_documents": ["IDENTITY_PROOF", "MEDICAL_FITNESS", "DRIVING_SCHOOL_CERT"],
                "eligibility_rules": {"min_age": 20, "vision_standard": "Pass"}
            }
        ]

        for at in app_types:
            existing_at = db.query(ApplicationType).filter(ApplicationType.code == at["code"]).first()
            if not existing_at:
                db.add(ApplicationType(**at))

        # 3. Create Seed Users
        users_data = [
            {
                "email": "admin@govflow.gov",
                "password": "AdminPassword123!",
                "full_name": "System Administrator",
                "role": UserRole.ADMINISTRATOR.value,
                "department_id": None
            },
            {
                "email": "officer.revenue@govflow.gov",
                "password": "OfficerPassword123!",
                "full_name": "Officer Rajesh Kumar",
                "role": UserRole.OFFICER.value,
                "department_id": dept_map["REV"].id
            },
            {
                "email": "citizen.demo@govflow.gov",
                "password": "CitizenPassword123!",
                "full_name": "Priya Sharma",
                "role": UserRole.CITIZEN.value,
                "department_id": None
            }
        ]

        for u_data in users_data:
            existing_u = db.query(User).filter(User.email == u_data["email"]).first()
            if existing_u:
                existing_u.hashed_password = get_password_hash(u_data["password"])
                existing_u.full_name = u_data["full_name"]
                existing_u.role = u_data["role"]
                existing_u.department_id = u_data["department_id"]
            else:
                user = User(
                    email=u_data["email"],
                    hashed_password=get_password_hash(u_data["password"]),
                    full_name=u_data["full_name"],
                    role=u_data["role"],
                    department_id=u_data["department_id"]
                )
                db.add(user)

        db.commit()
        print("Database schema recreated & seeded successfully with forensic document columns.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
