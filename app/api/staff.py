from sqlalchemy.orm import Session
from fastapi import HTTPException,Depends,APIRouter

from app.core.database import get_db
from app.api.auth import require_role
from app.models.user import User

from app.crud.staff import(
    create_staff,
    get_staff,
    get_staff_member,
    update_staff,
    delete_staff
)

from app.schemas.staff import(
    StaffCreate,
    StaffResponse
)

router = APIRouter(
    prefix="/staff",
    tags=["Staff"]
)

@router.post("/",response_model=StaffResponse)
def create(
    staff : StaffCreate,
    db : Session = Depends(get_db),
    current_user : User = Depends(require_role(["admin"]))
):
    return create_staff(db,staff)

@router.get("/",response_model=list[StaffResponse])
def read_all(
    db: Session = Depends(get_db),
    current_user : User = Depends(require_role(["admin"]))
):
    return get_staff(db)

@router.get("/{staff_id}",response_model=StaffResponse)
def read_one(
    staff_id : int,
    db: Session = Depends(get_db),
    current_user : User = Depends(require_role(["admin"]))
):
    staff = get_staff_member(db,staff_id)

    if not staff:
        raise HTTPException(
            status_code=404,
            detail="Staff Member not found!"
        )
    return staff

@router.put("/{staff_id}")
def update(
    staff_id : int,
    staff : StaffCreate,
    db : Session = Depends(get_db),
    current_user : User = Depends(require_role(["admin"]))
):
    updated = update_staff(
        db,
        staff_id,
        staff
    )
    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Staff not found!"
        )
    return updated

@router.delete("/{staff_id}")
def delete(
    staff_id : int,
    db : Session = Depends(get_db),
    current_user : User = Depends(require_role(["admin"]))
):
    deleted = delete_staff(
        db,
        staff_id
    )
    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Staff not found!"
        )
    return{
        "message" : "Staff Deleted Successfully!"
    }