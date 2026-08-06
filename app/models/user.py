from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50),nullable=False)

    doctor = relationship("Doctor", back_populates="user", uselist=False)
    staff = relationship("Staff",back_populates="user",uselist=False)

    # User delete hoga toh Doctor bhi delete ho jayega
    doctor = relationship(
        "Doctor", 
        back_populates="user", 
        uselist=False, 
        cascade="all, delete-orphan", 
        single_parent=True
    )

    # User delete hoga toh Staff bhi delete ho jayega
    staff = relationship(
        "Staff", 
        back_populates="user", 
        uselist=False, 
        cascade="all, delete-orphan", 
        single_parent=True
    )