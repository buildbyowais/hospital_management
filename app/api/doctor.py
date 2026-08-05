from fastapi import APIRouter,HTTPException,Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import require_role
from app.models.user import User

from app.schemas.doctor import(
    DoctorCreate,
    DoctorResponse
)

from app.crud.doctor import(
    create_doctor,
    get_doctor,
    get_doctors,
    update_doctor,
    delete_doctor
)

router = APIRouter(
    prefix="/doctors",
    tags=["Doctors"]
)


@router.post("/",response_model=DoctorResponse)
def create(
    doctor : DoctorCreate,
    db : Session = Depends(get_db),
    current_user : User = Depends(require_role(["admin"])) 
):
    return create_doctor(db,doctor)


@router.get("/",response_model=list[DoctorResponse])
def read_all(
    db: Session = Depends(get_db),
    current_user : User = Depends(require_role(["admin","doctor","staff"]))
):
    return get_doctors(db)


@router.get("/{doctor_id}",response_model=DoctorResponse)
def read_one(
    doctor_id : int,
    db: Session = Depends(get_db),
    current_user : User = Depends(require_role(["admin","doctor","staff"]))
):
    doctor = get_doctor(db,doctor_id)

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )
    return doctor


@router.put("/{doctor_id}")
def update(
    doctor_id : int,
    doctor : DoctorCreate,
    db : Session = Depends(get_db),
    current_user : User = Depends(require_role(["admin"]))
):
    updated = update_doctor(
        db,
        doctor_id,
        doctor
    )
    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )
    return updated

@router.delete("/{doctor_id}")
def delete(
    doctor_id : int,
    db : Session = Depends(get_db),
    current_user : User = Depends(require_role(["admin"])) 
):
    deleted = delete_doctor(
        db,
        doctor_id
    )
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Doctor not found"
        )
    return{
        "message" : "Doctor deleted Successfully!"
    }
    