import os
import uuid
from pathlib import Path

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends,
    HTTPException,
    status
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import require_role
from app.models.user import User
from app.models.patient import Patient
from app.models.report import PatientReport

from app.crud.patient import get_patient_by_user_id
from app.crud.doctor import get_doctor_by_user_id

from app.crud.report import (
    create_report,
    get_report,
    get_patient_reports,
    get_all_reports
)

from app.schemas.report import ReportResponse


router = APIRouter(
    prefix="/reports",
    tags=["Patient Reports"]
)


UPLOAD_DIR = Path("uploads/reports")
UPLOAD_DIR.mkdir(
    parents=True,
    exist_ok=True
)

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png"
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post(
    "/upload",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED
)
async def upload_report(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["patient"])
    )
):

    # Get logged-in patient
    patient = get_patient_by_user_id(
        db,
        current_user.id
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    # Check filename
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="File name is required"
        )

    extension = Path(
        file.filename
    ).suffix.lower()

    # Check extension
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, JPG, JPEG and PNG files are allowed"
        )

    # Read file
    file_content = await file.read()

    # Check size
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size must not exceed 10 MB"
        )

    # Generate unique filename
    unique_filename = (
        f"{uuid.uuid4()}{extension}"
    )

    file_path = UPLOAD_DIR / unique_filename

    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    # Save information in database
    report = create_report(
        db=db,
        patient_id=patient.id,
        file_name=file.filename,
        file_path=str(file_path),
        file_type=extension.replace(".", "")
    )

    return report

@router.get(
    "/my",
    response_model=list[ReportResponse]
)
def my_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["patient"])
    )
):
    patient = get_patient_by_user_id(
        db,
        current_user.id
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="Patient profile not found"
        )

    reports = get_patient_reports(
        db,
        patient.id
    )

    if not reports:
        raise HTTPException(
            status_code=404,
            detail="No reports found"
        )

    return reports

@router.get(
    "/doctor",
    response_model=list[ReportResponse]
)
def doctor_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["doctor"])
    )
):
    doctor = get_doctor_by_user_id(
        db,
        current_user.id
    )

    if not doctor:
        raise HTTPException(
            status_code=404,
            detail="Doctor profile not found"
        )

    reports = (
        db.query(PatientReport)
        .join(Patient)
        .filter(Patient.doctor_id == doctor.id)
        .all()
    )

    if not reports:
        raise HTTPException(
            status_code=404,
            detail="No reports found"
        )

    return reports

@router.get(
    "/all",
    response_model=list[ReportResponse]
)
def all_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["admin", "staff"])
    )
):
    reports = get_all_reports(db)

    if not reports:
        raise HTTPException(
            status_code=404,
            detail="No reports found"
        )

    return reports

@router.get("/download/{report_id}")
def download_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role([
            "admin",
            "staff",
            "doctor",
            "patient"
        ])
    )
):
    report = get_report(db, report_id)

    if not report:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )

    # Patient restriction
    if current_user.role == "patient":

        patient = get_patient_by_user_id(
            db,
            current_user.id
        )

        if not patient or report.patient_id != patient.id:
            raise HTTPException(
                status_code=403,
                detail="You can only access your own reports"
            )

    # Doctor restriction
    if current_user.role == "doctor":

        doctor = get_doctor_by_user_id(
            db,
            current_user.id
        )

        patient = (
            db.query(Patient)
            .filter(Patient.id == report.patient_id)
            .first()
        )

        if not doctor:
            raise HTTPException(
                status_code=404,
                detail="Doctor profile not found"
            )

        if not patient or patient.doctor_id != doctor.id:
            raise HTTPException(
                status_code=403,
                detail="You can only access reports of your patients"
            )

    if not os.path.exists(report.file_path):
        raise HTTPException(
            status_code=404,
            detail="File not found on server"
        )

    return FileResponse(
        path=report.file_path,
        filename=report.file_name,
        media_type="application/octet-stream"
    )
