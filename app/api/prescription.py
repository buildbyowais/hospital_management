from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import require_role
from app.models.user import User

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

    if not prescriptions:
        raise HTTPException(
            status_code=404,
            detail="No prescriptions found"
        )

    return prescriptions


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

    if not prescriptions:
        raise HTTPException(
            status_code=404,
            detail="No prescriptions found"
        )

    return prescriptions


# Admin / Staff can view a prescription
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


# Admin deletes prescription
@router.delete("/{prescription_id}")
def delete(
    prescription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["admin"])
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