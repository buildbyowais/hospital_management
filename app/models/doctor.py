from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    # Added email field for account linking
    email = Column(String(100), unique=True, nullable=False, index=True)
    gender = Column(String(20), nullable=False)
    specialization = Column(String(100), nullable=False)
    qualification = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    experience = Column(String(100), nullable=False)
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, unique=True)

    # Optional relationship back to User
    user = relationship("User", back_populates="doctor")

    # Cascade delete setup for patients
    patients = relationship(
        "Patient", 
        back_populates="doctor", 
        cascade="all, delete-orphan"
    )