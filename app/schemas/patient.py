from pydantic import BaseModel


class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    phone: str
    doctor_id : int


class PatientResponse(BaseModel):
    id: int
    name: str
    age: int
    gender: str
    phone: str
    doctor_id : int

    class Config:
        from_attributes = True