from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from sqlalchemy import or_
from app.core.database import get_db
from app.api.auth import require_role
from app.models.user import User
from app.models.prescription import Prescription

from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionResponse
)

from app.crud.prescription import (
    create_prescription,
    get_prescription,
    get_prescriptions_by_patient,
    get_prescriptions_by_doctor,
    delete_prescription
)

from app.crud.patient import get_patient_by_user_id
from app.crud.doctor import get_doctor_by_user_id


router = APIRouter(
    prefix="/prescriptions",
    tags=["Prescriptions"]
)


# Doctor creates prescription
@router.post(
    "/",
    response_model=PrescriptionResponse,
    status_code=status.HTTP_201_CREATED
)
def create(
    prescription: PrescriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["doctor"])
    )
):
    doctor = get_doctor_by_user_id(
        db,
        current_user.id
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor profile not found"
        )

    return create_prescription(
        db,
        doctor.id,
        prescription
    )


# Admin sees all prescriptions (VIEW ONLY)
@router.get(
    "/admin",
    response_model=list[PrescriptionResponse]
)
def admin_prescriptions(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["admin"])
    )
):
    # Build the query
    query = db.query(Prescription)
    
    # Apply search filter if provided
    if search:
        query = query.filter(
            or_(
                Prescription.medicine_name.ilike(f"%{search}%"),
                Prescription.dosage.ilike(f"%{search}%")
            )
        )
    
    # Apply pagination
    prescriptions = query.offset(skip).limit(limit).all()
    
    return prescriptions


# Patient sees only own prescriptions
@router.get(
    "/my",
    response_model=list[PrescriptionResponse]
)
def my_prescriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["patient"])
    )
):
    patient = get_patient_by_user_id(
        db,
        current_user.id
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    prescriptions = get_prescriptions_by_patient(
        db,
        patient.id
    )

    return prescriptions if prescriptions else []


# Doctor sees prescriptions created by him
@router.get(
    "/doctor",
    response_model=list[PrescriptionResponse]
)
def doctor_prescriptions(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["doctor"])
    )
):
    doctor = get_doctor_by_user_id(
        db,
        current_user.id
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor profile not found"
        )

    prescriptions = get_prescriptions_by_doctor(
        db,
        doctor.id
    )

    return prescriptions if prescriptions else []


# View single prescription
@router.get(
    "/{prescription_id}",
    response_model=PrescriptionResponse
)
def read_one(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["admin", "staff", "doctor", "patient"])
    )
):
    prescription = get_prescription(
        db,
        prescription_id
    )

    if not prescription:
        raise HTTPException(
            status_code=404,
            detail="Prescription not found"
        )

    # Admin can view any prescription
    if current_user.role == "admin":
        return prescription

    # Doctor restriction
    if current_user.role == "doctor":
        doctor = get_doctor_by_user_id(
            db,
            current_user.id
        )

        if not doctor:
            raise HTTPException(
                status_code=404,
                detail="Doctor profile not found"
            )

        if prescription.doctor_id != doctor.id:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own prescriptions"
            )

    # Patient restriction
    if current_user.role == "patient":
        patient = get_patient_by_user_id(
            db,
            current_user.id
        )

        if not patient:
            raise HTTPException(
                status_code=404,
                detail="Patient profile not found"
            )

        if prescription.patient_id != patient.id:
            raise HTTPException(
                status_code=403,
                detail="You can only view your own prescriptions"
            )

    return prescription


# Admin deletes prescription (Optional - remove if admin shouldn't delete)
@router.delete(
    "/{prescription_id}"
)
def delete(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["doctor"])
    )
):
    deleted = delete_prescription(
        db,
        prescription_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Prescription not found"
        )

    return {
        "message": "Prescription deleted successfully"
    }