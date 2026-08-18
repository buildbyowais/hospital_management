import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, SessionLocal
from app.models.user import Base
from app.models.user import User
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

def init_admin():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        from passlib.context import CryptContext

        admin_username = os.getenv("ADMIN_USERNAME")
        admin_password = os.getenv("ADMIN_PASSWORD")

        if admin_username and admin_password:
            existing_admin = db.query(User).filter(User.username == admin_username).first()
            if not existing_admin:
                pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
                
                # 72 bytes limit fix for bcrypt
                safe_password = admin_password[:72]
                
                new_admin = User(
                    username=admin_username,
                    email="admin@medicore.com",
                    hashed_password=pwd_context.hash(safe_password),
                    role="admin"
                )
                db.add(new_admin)
                db.commit()
                print(f"--> [SUCCESS] Admin '{admin_username}' created successfully!")
            else:
                print(f"--> [INFO] Admin '{admin_username}' already exists.")
        else:
            print("--> [ERROR] Environment variables missing!")
    except Exception as e:
        print(f"--> [ERROR] Admin creation failed: {e}")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_admin()
    yield

app = FastAPI(title="Hospital Management API", lifespan=lifespan)

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
    db = SessionLocal()
    target_username = os.getenv("ADMIN_USERNAME", "admin")
    user = db.query(User).filter(User.username == target_username).first()
    db.close()
    if user:
        return {"exists": True, "username": user.username, "role": user.role}
    return {"exists": False, "searched_for": target_username}