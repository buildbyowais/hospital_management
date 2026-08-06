from pydantic import BaseModel, EmailStr
from typing import Optional


class DoctorBase(BaseModel):
    name: str
    email: EmailStr
    gender: str
    specialization: str
    qualification: str
    phone: str
    experience: str


class DoctorCreate(DoctorBase):
    pass


class DoctorResponse(DoctorBase):
    id: int
    user_id: Optional[int] = None

    class Config:
        from_attributes = True


class DoctorRegisterSchema(BaseModel):
    username: str
    email: EmailStr
    password: str