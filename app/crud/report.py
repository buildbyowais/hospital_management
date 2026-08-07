from sqlalchemy.orm import Session
from app.models.report import PatientReport


def create_report(
    db: Session,
    patient_id: int,
    file_name: str,
    file_path: str,
    file_type: str
):
    report = PatientReport(
        patient_id=patient_id,
        file_name=file_name,
        file_path=file_path,
        file_type=file_type
    )

    db.add(report)
    db.commit()
    db.refresh(report)

    return report


def get_report(
    db: Session,
    report_id: int
):
    return (
        db.query(PatientReport)
        .filter(PatientReport.id == report_id)
        .first()
    )


def get_patient_reports(
    db: Session,
    patient_id: int
):
    return (
        db.query(PatientReport)
        .filter(PatientReport.patient_id == patient_id)
        .all()
    )


def get_all_reports(db: Session):
    return db.query(PatientReport).all()


def delete_report(
    db: Session,
    report_id: int
):
    report = get_report(db, report_id)

    if not report:
        return None

    db.delete(report)
    db.commit()

    return report