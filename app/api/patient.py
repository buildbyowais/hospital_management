from fastapi import APIRouter, Depends, HTTPException,status
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.core.database import get_db
from app.models.user import User
from app.models.patient import Patient
from app.api.auth import require_role
from app.crud.doctor import get_doctor_by_user_id

from app.schemas.patient import (
    PatientCreate,
    PatientResponse,
    PatientRegisterSchema
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

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_patient(
    data: PatientRegisterSchema,
    db: Session = Depends(get_db)
):
    # Find existing patient profile
    patient = (
        db.query(Patient)
        .filter(Patient.email.ilike(data.email))
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="No patient profile found for this email. Please contact the administrator."
        )

    # Already linked?
    if patient.user_id is not None:
        raise HTTPException(
            status_code=400,
            detail="This patient profile is already registered."
        )

    # Username already exists?
    existing_username = (
        db.query(User)
        .filter(User.username == data.username)
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already taken."
        )

    # Email already exists?
    existing_email = (
        db.query(User)
        .filter(User.email.ilike(data.email))
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists."
        )

    try:
        # Create patient user account
        new_user = User(
            username=data.username,
            email=data.email,
            hashed_password=get_password_hash(data.password),
            role="patient"
        )

        db.add(new_user)
        db.flush()

        # Link patient profile with user
        patient.user_id = new_user.id

        db.commit()

        db.refresh(patient)

        return {
            "message": "Patient account successfully registered and linked!",
            "user_id": new_user.id,
            "patient_id": patient.id,
            "role": new_user.role
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
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