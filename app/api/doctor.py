from fastapi import APIRouter, HTTPException, Depends, status,Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import require_role
from app.core.security import get_password_hash 
from app.models.user import User
from app.models.doctor import Doctor

from app.schemas.doctor import (
    DoctorCreate,
    DoctorResponse,
    DoctorRegisterSchema
)

from app.crud.doctor import (
    create_doctor,
    get_doctor,
    get_doctors,
    update_doctor,
    delete_doctor
)

router = APIRouter(
    prefix="/doctors",
    tags=["Doctors"]
)

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_doctor(
    data: DoctorRegisterSchema,
    db: Session = Depends(get_db)
):
    # Find existing doctor profile
    doctor = (
        db.query(Doctor)
        .filter(Doctor.email.ilike(data.email))
        .first()
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="No doctor profile found for this email. Please contact the administrator."
        )

    # Already linked?
    if doctor.user_id is not None:
        raise HTTPException(
            status_code=400,
            detail="This doctor profile is already registered."
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
        # Create doctor user account
        new_user = User(
            username=data.username,
            email=data.email,
            hashed_password=get_password_hash(data.password),
            role="doctor"
        )

        db.add(new_user)
        db.flush()

        # Link doctor profile with user
        doctor.user_id = new_user.id

        db.commit()

        db.refresh(doctor)

        return {
            "message": "Doctor account successfully registered and linked!",
            "user_id": new_user.id,
            "doctor_id": doctor.id,
            "role": new_user.role
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def create(
    doctor: DoctorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])) 
):
    return create_doctor(db, doctor)


@router.get("/", response_model=list[DoctorResponse])
def read_all(
    search: str | None = None,
    specialization: str | None = None,
    skip: int = 0,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["admin"])
    )
):
    doctors = get_doctors(
        db,
        search=search,
        specialization=specialization,
        skip=skip,
        limit=limit
    )

    if not doctors:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    return doctors

@router.get("/{doctor_id}", response_model=DoctorResponse)
def read_one(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["admin"])
    )
):
    doctor = get_doctor(db, doctor_id)

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )

    return doctor


@router.put("/{doctor_id}")
def update(
    doctor_id: int,
    doctor: DoctorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    updated = update_doctor(db, doctor_id, doctor)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    return updated


@router.delete("/{doctor_id}")
def delete(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])) 
):
    deleted = delete_doctor(db, doctor_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    return {"message": "Doctor deleted successfully!"}