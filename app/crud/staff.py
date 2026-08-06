from sqlalchemy.orm import Session

from app.models.staff import Staff
from app.schemas.staff import StaffCreate

def create_staff(db:Session,staff:StaffCreate):
    db_staff = Staff(
        name = staff.name,
        gender = staff.gender,
        email = staff.email,
        designation = staff.designation,
        department = staff.department,
        phone = staff.phone,
        salary = staff.salary,
        user_id = None
    )
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)

    return db_staff

def get_staff(db:Session):
    return db.query(Staff).all()

def get_staff_member(db:Session,staff_id:int):
    return(
        db.query(Staff)
        .filter(Staff.id == staff_id)
        .first()
    )

def update_staff(
        db : Session,
        staff_id : int,
        staff : StaffCreate
):
    db_staff = get_staff_member(db,staff_id)

    if not db_staff:
        return None
    db_staff.name = staff.name
    db_staff.gender = staff.gender
    db_staff.email = staff.email,
    db_staff.designation = staff.designation
    db_staff.department = staff.department
    db_staff.phone = staff.phone
    db_staff.salary = staff.salary

    db.commit()
    db.refresh(db_staff)

    return db_staff

def delete_staff(
        db : Session,
        staff_id : int        
):
    db_staff = get_staff_member(db,staff_id)

    if not db_staff:
        return None
    db.delete(db_staff)
    db.commit()

    return db_staff


