import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine
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

# Create database tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Hospital Management API")

# CORS Middleware (Allow all origins for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(patient_router)
app.include_router(doctor_router)
app.include_router(staff_router)
app.include_router(auth_router)
app.include_router(appointment_router)
app.include_router(prescription_router)
app.include_router(patient_report_router)

@app.get("/")
def home():
    return {"message": "Hospital Management System is running!"}