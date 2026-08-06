from sqlalchemy.orm import Session
from fastapi import HTTPException,Depends,APIRouter,status

from app.core.database import get_db
from app.api.auth import require_role
from app.models.user import User
from app.models.staff import Staff
from app.core.security import get_password_hash


from app.crud.staff import(
    create_staff,
    get_staff,
    get_staff_member,
    update_staff,
    delete_staff
)

from app.schemas.staff import(
    StaffCreate,
    StaffResponse,
    StaffRegisterSchema
)

router = APIRouter(
    prefix="/staff",
    tags=["Staff"]
)

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_staff(
    data: StaffRegisterSchema,
    db: Session = Depends(get_db)
):
    # Find existing staff profile
    staff = (
        db.query(Staff)
        .filter(Staff.email.ilike(data.email))
        .first()
    )

    if not staff:
        raise HTTPException(
            status_code=404,
            detail="No staff profile found for this email. Please contact the administrator."
        )

    # Already linked?
    if staff.user_id is not None:
        raise HTTPException(
            status_code=400,
            detail="This staff profile is already registered."
        )

    # Username already exists?
    existing_username = (
        db.query(User)
        .filter(User.username == data.username)
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=400,
            detail="Username already taken."
        )

    # Email already exists?
    existing_email = (
        db.query(User)
        .filter(User.email.ilike(data.email))
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists."
        )

    try:
        # Create staff user account
        new_user = User(
            username=data.username,
            email=data.email,
            hashed_password=get_password_hash(data.password),
            role="staff"
        )

        db.add(new_user)
        db.flush()

        # Link staff profile with user
        staff.user_id = new_user.id

        db.commit()

        db.refresh(staff)

        return {
            "message": "staff account successfully registered and linked!",
            "user_id": new_user.id,
            "staff_id": staff.id,
            "role": new_user.role
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Registration failed: {str(e)}"
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