from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.patient import Patient
from app.models.doctor import Doctor
from app.schemas.patient import PatientCreate


def create_patient(db: Session, patient: PatientCreate):
    db_patient = Patient(
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        phone=patient.phone,
        doctor_id = patient.doctor_id
    )
    doctor = db.query(Doctor).filter(Doctor.id==patient.doctor_id).first()

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor id is not correct,Doctor not found!"
        )

    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)

    return db_patient


def get_patients(db: Session):
    return db.query(Patient).all()


def get_patient(db: Session, patient_id: int):
    return (
        db.query(Patient)
        .filter(Patient.id == patient_id)
        .first()
    )

def update_patient(
    db: Session,
    patient_id: int,
    patient: PatientCreate
):
    db_patient = get_patient(db, patient_id)

    if not db_patient:
        return None

    db_patient.name = patient.name
    db_patient.age = patient.age
    db_patient.gender = patient.gender
    db_patient.phone = patient.phone
    db_patient.doctor_id = patient.doctor_id

    doctor = db.query(Doctor).filter(Doctor.id==patient.doctor_id).first()

    if not doctor:
            raise HTTPException(
                status_code=404,
                detail="Doctor id is not correct,Doctor not found!"
            )

    db.commit()
    db.refresh(db_patient)

    return db_patient


def delete_patient(
    db: Session,
    patient_id: int
):
    db_patient = get_patient(db, patient_id)

    if not db_patient:
        return None

    db.delete(db_patient)
    db.commit()

    return db_patient

def get_patients_by_doctor(db:Session,doctor_id:int):
    return(
        db.query(Patient)
        .filter(Patient.doctor_id == doctor_id)
        .all()
    )