from sqlalchemy import Column, Integer, String,ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    phone = Column(String(20), nullable=False)

    # Foreign Key with ON DELETE CASCADE
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)

    doctor = relationship("Doctor", back_populates="patients")