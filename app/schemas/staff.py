from pydantic import BaseModel,EmailStr
from typing import Optional

class StaffCreate(BaseModel):
    name : str
    gender : str
    designation : str
    department : str
    phone : str
    salary : int
    email: EmailStr

class StaffResponse(BaseModel):
    id : int
    name : str
    gender : str
    designation : str
    department : str
    phone : str
    salary : int
    user_id: Optional[int] = None

    class Config:
        from_attributes = True


class StaffRegisterSchema(BaseModel):
    username: str
    email: EmailStr
    password: str