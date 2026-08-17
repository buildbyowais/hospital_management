from pydantic import BaseModel
from datetime import date
from typing import Optional

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

class PrescriptionUpdate(BaseModel):
    medicine: Optional[str] = None
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None
    date: Optional[str] = None

    class Config:
        from_attributes = True