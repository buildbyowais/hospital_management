from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.prescription import Prescription
from app.models.patient import Patient
from app.models.doctor import Doctor
from app.schemas.prescription import PrescriptionCreate


def create_prescription(
    db: Session,
    doctor_id: int,
    prescription: PrescriptionCreate
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == prescription.patient_id)
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    doctor = (
        db.query(Doctor)
        .filter(Doctor.id == doctor_id)
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor profile not found"
        )

    # Doctor sirf apne patient ko prescription de sakta hai
    if patient.doctor_id != doctor_id:
        raise HTTPException(
            status_code=403,
            detail="You can only create prescriptions for your own patients"
        )

    db_prescription = Prescription(
        patient_id=prescription.patient_id,
        doctor_id=doctor_id,
        medicine=prescription.medicine,
        dosage=prescription.dosage,
        frequency=prescription.frequency,
        duration=prescription.duration,
        instructions=prescription.instructions,
        date=prescription.date
    )

    db.add(db_prescription)
    db.commit()
    db.refresh(db_prescription)

    return db_prescription


def get_prescription(
    db: Session,
    prescription_id: int
):
    return (
        db.query(Prescription)
        .filter(Prescription.id == prescription_id)
        .first()
    )


def get_prescriptions_by_patient(
    db: Session,
    patient_id: int
):
    return (
        db.query(Prescription)
        .filter(Prescription.patient_id == patient_id)
        .all()
    )


def get_prescriptions_by_doctor(
    db: Session,
    doctor_id: int
):
    return (
        db.query(Prescription)
        .filter(Prescription.doctor_id == doctor_id)
        .all()
    )


def delete_prescription(
    db: Session,
    prescription_id: int
):
    prescription = get_prescription(
        db,
        prescription_id
    )

    if not prescription:
        return None

    db.delete(prescription)
    db.commit()

    return prescription

def get_all_prescriptions(db: Session):
    """Get all prescriptions (admin only)"""
    return db.query(Prescription).all()

def update_prescription(db: Session, prescription_id: int, update_data):
    prescription = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not prescription:
        return None
    for key, value in update_data.dict(exclude_unset=True).items():
        setattr(prescription, key, value)
    db.commit()
    db.refresh(prescription)
    return prescription