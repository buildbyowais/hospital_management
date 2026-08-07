from pydantic import BaseModel
from datetime import date, time
from enum import Enum


class AppointmentStatus(str, Enum):
    SCHEDULED = "Scheduled"
    CONFIRMED = "Confirmed"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    NO_SHOW = "No Show"


class AppointmentCreate(BaseModel):
    patient_id : int
    doctor_id: int
    appointment_date: date
    appointment_time: time
    reason: str


class AppointmentStatusUpdate(BaseModel):
    status: AppointmentStatus


class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    appointment_date: date
    appointment_time: time
    reason: str
    status: AppointmentStatus

    class Config:
        from_attributes = True