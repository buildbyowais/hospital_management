from sqlalchemy.orm import Session

from app.models.doctor import Doctor
from app.schemas.doctor import DoctorCreate
from app.models.user import User

def create_doctor(db:Session,doctor:DoctorCreate):
    db_doctor = Doctor(
        name = doctor.name,
        gender = doctor.gender,
        email = doctor.email,
        specialization = doctor.specialization,
        qualification = doctor.qualification,
        phone = doctor.phone,
        experience = doctor.experience,
        user_id = None
    )

    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)

    return db_doctor

def get_doctors(db:Session):
    return db.query(Doctor).all()

def get_doctor(db:Session,doctor_id:int):
    return(
        db.query(Doctor)
        .filter(Doctor.id == doctor_id)
        .first()
    )

    
def update_doctor(
    db: Session,
    doctor_id: int,
    doctor: DoctorCreate
):
    db_doctor = get_doctor(db, doctor_id)

    if not db_doctor:
        return None

    db_doctor.name = doctor.name
    db_doctor.gender = doctor.gender
    db_doctor.email = doctor.email
    db_doctor.specialization = doctor.specialization
    db_doctor.qualification = doctor.qualification
    db_doctor.phone = doctor.phone
    db_doctor.experience = doctor.experience

    db.commit()
    db.refresh(db_doctor)

    return db_doctor

def delete_doctor(db: Session, doctor_id: int):
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        return False

    # Agar doctor ke sath linked user login account hai to pehle use delete karo
    if doctor.user_id:
        user = db.query(User).filter(User.id == doctor.user_id).first()
        if user:
            db.delete(user)

    db.delete(doctor)
    db.commit()
    return True

def get_doctor_by_user_id(db,user_id:int):
    return(
        db.query(Doctor)
        .filter(Doctor.user_id == user_id)
        .first()        
    )
    
