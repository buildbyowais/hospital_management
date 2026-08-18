from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from app.core.database import engine, SessionLocal
from app.models.user import Base
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.models.staff import Staff
from app.models.appointment import Appointment
from app.models.prescription import Prescription
from app.models.report import PatientReport

from app.api.patient import router as patient_router
from app.api.doctor import router as doctor_router
from app.api.staff import router as staff_router
from app.api.auth import router as auth_router
from app.api.appointment import router as appointment_router
from app.api.prescription import router as prescription_router
from app.api.report import router as patient_report_router

Base.metadata.create_all(bind=engine)

try:
    db = SessionLocal()
    from app.models.user import User
    from passlib.context import CryptContext

    admin_username = os.getenv("ADMIN_USERNAME")
    admin_password = os.getenv("ADMIN_PASSWORD")

    if admin_username and admin_password:
        existing_admin = db.query(User).filter(User.username == admin_username).first()
        if not existing_admin:
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            new_admin = User(
                username=admin_username,
                email="admin@medicore.com",
                hashed_password=pwd_context.hash(admin_password),
                role="admin"
            )
            db.add(new_admin)
            db.commit()
            print(f"Admin user '{admin_username}' created automatically from ENV.")
        else:
            print(f"Admin user '{admin_username}' already exists.")
    db.close()
except Exception as e:
    print(f"Admin creation skipped: {e}")

app = FastAPI(title="Hospital Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patient_router)
app.include_router(doctor_router)
app.include_router(staff_router)
app.include_router(auth_router)
app.include_router(appointment_router)
app.include_router(prescription_router)
app.include_router(patient_report_router)

@app.get("/")
def home():
    return {"message": "Hospital Management System!"}


@app.get("/check-admin")
def check_admin():
    from app.core.database import SessionLocal
    from app.models.user import User
    db = SessionLocal()
    user = db.query(User).filter(User.username == "admin").first()
    db.close()
    if user:
        return {"exists": True, "username": user.username, "role": user.role}
    return {"exists": False}