from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import require_role
from app.models.user import User

from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentStatusUpdate
)

from app.crud.appointment import (
    create_patient_appointment,
    get_appointment,
    get_appointments_by_doctor,
    get_appointments_by_patient,
    update_appointment_status
)

from app.crud.patient import get_patient_by_user_id
from app.crud.doctor import get_doctor_by_user_id


router = APIRouter(
    prefix="/appointments",
    tags=["Appointments"]
)


@router.post(
    "/request",
    response_model=AppointmentResponse,
    status_code=status.HTTP_201_CREATED
)
def request_appointment(
    appointment: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["patient", "admin"]))
):
    if current_user.role == "patient":
        patient = get_patient_by_user_id(db, current_user.id)
        if not patient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient profile not found for this user"
            )
        
        final_patient_id = patient.id

    else:
        final_patient_id = appointment.patient_id

    return create_patient_appointment(
        db=db,
        patient_id=final_patient_id,
        appointment=appointment
    )


@router.get(
    "/doctor",
    response_model=list[AppointmentResponse]
)
def doctor_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["doctor","admin"])
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

    appointments = get_appointments_by_doctor(
        db,
        doctor.id
    )

    if not appointments:
        raise HTTPException(
            status_code=404,
            detail="No appointments found"
        )

    return appointments

@router.get(
    "/patient",
    response_model=list[AppointmentResponse]
)
def patient_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["patient","admin"])
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

    appointments = get_appointments_by_patient(
        db,
        patient.id
    )

    if not appointments:
        raise HTTPException(
            status_code=404,
            detail="No appointments found"
        )

    return appointments


@router.put(
    "/{appointment_id}/status",
    response_model=AppointmentResponse
)
def update_status(
    appointment_id: int,
    data: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["doctor", "admin", "staff"])
    )
):
    appointment = get_appointment(
        db,
        appointment_id
    )

    if not appointment:
        raise HTTPException(
            status_code=404,
            detail="Appointment not found"
        )
    #Doctor can only update the status of his own patients | Staff & Admin can update any patient
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

        if appointment.doctor_id != doctor.id:
            raise HTTPException(
                status_code=403,
                detail="You can only manage your own appointments"
            )

    return update_appointment_status(
        db,
        appointment_id,
        data.status.value
    )


