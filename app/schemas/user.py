from pydantic import BaseModel

class UserCreate(BaseModel):
    username : str
    email : str
    password :str
    role :str

class UserResponse(BaseModel):
    id : int
    username : str
    email : str
    role :str

    class config:
        from_attributes = True
        