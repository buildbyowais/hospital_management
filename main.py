from fastapi import FastAPI

from app.api.patient import router as patient_router
from app.api.doctor import router as doctor_router
from app.api.staff import router as staff_router
from app.api.auth import router as auth_router
from app.api.appointment import router as appointment_router
from app.api.prescription import router as prescription_router
from app.api.report import router as patient_report_router

app = FastAPI(
    title="Hospital Management API"
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
    return {
        "message": "Hospital Management System!"
    }