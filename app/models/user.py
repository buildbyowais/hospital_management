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

    #All relationships of users with doctor,staff and patient
    doctor = relationship("Doctor", back_populates="user", uselist=False)
    staff = relationship("Staff",back_populates="user",uselist=False)
    patient = relationship("Patient",back_populates="user",uselist=False)

    # Auto-deletes linked doctor profile on user deletion
    doctor = relationship(
        "Doctor", 
        back_populates="user", 
        uselist=False, 
        cascade="all, delete-orphan", 
        single_parent=True
    )

    # Auto-deletes linked staff profile on user deletion
    staff = relationship(
        "Staff", 
        back_populates="user", 
        uselist=False, 
        cascade="all, delete-orphan", 
        single_parent=True
    )

    # Auto-deletes linked patient profile on user deletion
    patient = relationship(
        "Patient", 
        back_populates="user", 
        uselist=False, 
        cascade="all, delete-orphan", 
        single_parent=True
    )