from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.appointment import Appointment
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.schemas.appointment import AppointmentCreate


def create_patient_appointment(
    db: Session,
    patient_id: int,
    appointment: AppointmentCreate
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id)
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    doctor = (
        db.query(Doctor)
        .filter(Doctor.id == appointment.doctor_id)
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor profile not found"
        )

    db_appointment = Appointment(
        patient_id=patient_id,
        doctor_id=appointment.doctor_id,
        appointment_date=appointment.appointment_date,
        appointment_time=appointment.appointment_time,
        reason=appointment.reason,
        status="Scheduled"
    )

    db.add(db_appointment)
    db.commit()
    db.refresh(db_appointment)

    return db_appointment


def get_appointment(
    db: Session,
    appointment_id: int
):
    return (
        db.query(Appointment)
        .filter(Appointment.id == appointment_id)
        .first()
    )


def get_appointments_by_doctor(
    db: Session,
    doctor_id: int
):
    return (
        db.query(Appointment)
        .filter(Appointment.doctor_id == doctor_id)
        .all()
    )


def get_appointments_by_patient(
    db: Session,
    patient_id: int
):
    return (
        db.query(Appointment)
        .filter(Appointment.patient_id == patient_id)
        .all()
    )


def update_appointment_status(
    db: Session,
    appointment_id: int,
    status: str
):
    appointment = get_appointment(
        db,
        appointment_id
    )

    if not appointment:
        return None

    appointment.status = status

    db.commit()
    db.refresh(appointment)

    return appointment