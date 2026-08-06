from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.user import User
from app.api.auth import require_role
from app.crud.doctor import get_doctor_by_user_id

from app.schemas.patient import (
    PatientCreate,
    PatientResponse
)

from app.crud.patient import (
    create_patient,
    get_patients,
    get_patient,
    update_patient,
    delete_patient,
    get_patients_by_doctor
)

router = APIRouter(
    prefix="/patients",
    tags=["Patients"]
)


@router.post("/", response_model=PatientResponse)
def create(
    patient: PatientCreate,
    db: Session = Depends(get_db),
    current_user : User = Depends(require_role(["admin","staff"]))
):
    return create_patient(db, patient)


@router.get("/", response_model=list[PatientResponse])
def read_all(
    db: Session = Depends(get_db),
    current_user : User = Depends(require_role(["admin","doctor","staff"]))
):
    if current_user.role == "doctor":
        doctor = get_doctor_by_user_id(db,current_user.id)

        if not doctor:
            raise HTTPException(
                status_code=404,
                detail="Doctor Profile not found"
            )
        return get_patients_by_doctor(db,doctor.id)
        
    return get_patients(db)


@router.get("/{patient_id}", response_model=PatientResponse)
def read_one(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user : User = Depends(require_role(["admin","doctor","staff"]))
):
    patient = get_patient(db, patient_id)

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    return patient

@router.put("/{patient_id}", response_model=PatientResponse)
def update(
    patient_id: int,
    patient: PatientCreate,
    db: Session = Depends(get_db),
    current_user : User = Depends(require_role(["admin","staff"]))
):
    updated = update_patient(
        db,
        patient_id,
        patient
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    return updated


@router.delete("/{patient_id}")
def delete(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user : User = Depends(require_role(["admin"]))
):
    deleted = delete_patient(
        db,
        patient_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Patient not found"
        )

    return {
        "message": "Patient deleted successfully"
    }