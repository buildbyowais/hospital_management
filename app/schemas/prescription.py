from pydantic import BaseModel
from datetime import date


class PrescriptionCreate(BaseModel):
    patient_id: int
    medicine: str
    dosage: str
    frequency: str
    duration: str
    instructions: str
    date: date


class PrescriptionResponse(BaseModel):
    id: int
    patient_id: int
    doctor_id: int
    medicine: str
    dosage: str
    frequency: str
    duration: str
    instructions: str
    date: date

    class Config:
        from_attributes = True