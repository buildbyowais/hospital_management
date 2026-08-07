from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import Optional

from app.models.patient import Patient
from app.models.doctor import Doctor
from app.schemas.patient import PatientCreate


def create_patient(db: Session, patient: PatientCreate):
    db_patient = Patient(
        name=patient.name,
        age=patient.age,
        gender=patient.gender,
        phone=patient.phone,
        doctor_id = patient.doctor_id,
        email =  patient.email
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


def get_patients(
    db: Session, 
    search: Optional[str] = None, 
    doctor_id: Optional[int] = None, 
    skip: int = 0, 
    limit: int = 10
):
    query = db.query(Patient)

    if doctor_id is not None:
        query = query.filter(Patient.doctor_id == doctor_id)

    if search:
        query = query.filter(Patient.name.ilike(f"%{search}%"))

    return query.offset(skip).limit(limit).all()


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
    db_patient.email = patient.email
    
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

def get_patient_by_user_id(
    db: Session,
    user_id: int
):
    return (
        db.query(Patient)
        .filter(Patient.user_id == user_id)
        .first()
    )