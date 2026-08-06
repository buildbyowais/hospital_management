from sqlalchemy import Column,Integer,String,ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer,primary_key=True,index=True)

    name = Column(String(100),nullable=False)

    gender = Column (String(20), nullable=False)

    designation  = Column (String(100),nullable=False)

    department = Column(String(100),nullable=False)

    phone = Column(String(20),nullable=False)

    salary = Column(Integer,nullable=False)

    email = Column(String(100), unique=True, nullable=False, index=True)

    user_id = Column(Integer,ForeignKey("users.id"),nullable=True,unique=True)

    user = relationship("User",back_populates="staff")

    # Staff delete hoga toh User bhi delete ho jayega
    user = relationship(
        "User",
        back_populates="staff", 
        uselist=False, 
        cascade="all, delete-orphan", 
        single_parent=True
    )