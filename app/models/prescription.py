from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base

class Prescription(Base):
    __tablename__ = "prescriptions"

    id =  Column(Integer,primary_key=True,nullable=False)

    patient_id = Column(Integer,ForeignKey("patients.id"),nullable=False)

    doctor_id = Column(Integer,ForeignKey("doctors.id"),nullable=False)

    medicine = Column(String(150),nullable=False)

    dosage = Column(String(100),nullable=False)

    frequency = Column(String(100),nullable=False)

    duration = Column(String(100),nullable=False)

    instructions = Column(String(255),nullable=False)

    date = Column(Date,nullable=False)

    # prescription ↔ Patient
    patient  = relationship(
        "Patient",
        back_populates="prescriptions"
    )
    # prescription ↔ doctor
    doctor  = relationship(
        "Doctor",
        back_populates="prescriptions"
    )