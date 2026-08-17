from pydantic import BaseModel,EmailStr


class PatientCreate(BaseModel):
    name: str
    age: int
    gender: str
    phone: str
    doctor_id : int
    email: EmailStr


class PatientResponse(BaseModel):
    id: int
    name: str
    age: int
    gender: str
    phone: str
    doctor_id : int
    email: EmailStr

    class Config:
        from_attributes = True

class PatientRegisterSchema(BaseModel):
    username: str
    email: EmailStr
    password: str