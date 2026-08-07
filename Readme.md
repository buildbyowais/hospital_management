# 🏥 Hospital Management System

A backend-based **Hospital Management System** built with **FastAPI, SQLAlchemy, PostgreSQL, JWT Authentication, and Alembic**.

The system manages hospital users, doctors, staff, patients, appointments, prescriptions, and patient medical reports with **role-based access control and data restrictions**.

---

## 🚀 Features

### 🔐 Authentication & Authorization

* User registration and login
* JWT-based authentication
* Access Token and Refresh Token
* Password hashing
* Role-based authorization
* Protected API endpoints
* Permission-based access control

### 👥 User Roles

The system currently supports:

* **Admin**
* **Doctor**
* **Staff**
* **Patient**

Each role has different permissions and restrictions.

---

## 👨‍⚕️ Doctor Management

Admin can:

* Create doctors
* Update doctors
* Delete doctors
* View doctors
* Search doctors by:

  * Name
  * Specialization
  * Email
* Pagination support

### Doctor Account Linking

Doctor profiles are linked with user accounts through `user_id`.

When a doctor registers:

```text
Doctor Profile
      ↓
Doctor Registration
      ↓
User Account Created
      ↓
user_id linked to Doctor
```

Deleting a doctor also removes the linked user account.

---

## 👨‍💼 Staff Management

Admin can:

* Create staff
* Update staff
* Delete staff
* View staff
* Search staff by name
* Filter staff by designation
* Pagination support

Staff accounts are linked with user accounts using `user_id`.

Deleting a staff member also removes the linked user account.

---

## 🧑‍⚕️ Patient Management

The system supports:

* Patient creation
* Patient update
* Patient deletion
* Patient registration
* Patient login
* Patient ↔ User linking
* Doctor ↔ Patient relationship
* Search and filtering
* Pagination
* Role-based patient access

### Patient Restrictions

A doctor can only access patients assigned to that doctor.

A patient can only access their own information and related records.

Deleting a patient also removes the linked user account.

---

## 📅 Appointment Management

The appointment module supports:

* Patient ID
* Doctor ID
* Appointment date
* Appointment time
* Reason
* Appointment status

### Appointment Status

```text
Scheduled
Confirmed
Completed
Cancelled
No Show
```

### Appointment Flow

```text
Patient
   ↓
Appointment Request
   ↓
Doctor Selection
   ↓
Date & Time
   ↓
Appointment Created
   ↓
Doctor Reviews Appointment
   ↓
Appointment Completed
```

### Appointment Access

Appointments are protected according to the logged-in user's role.

Patients can access their own appointments, while doctors can manage their relevant appointments.

---

## 💊 Prescription Management

Doctors can create prescriptions for patients.

Prescription information includes:

* Patient
* Doctor
* Medicine
* Dosage
* Frequency
* Duration
* Instructions
* Date

Prescriptions are linked with both:

```text
Patient ↔ Prescription ↔ Doctor
```

This allows medical prescriptions to remain associated with the correct patient and doctor.

---

## 📄 Patient Reports / File Upload

Patients can upload their medical reports and documents.

Supported examples:

* Blood Test Reports
* X-Ray
* MRI
* CT Scan
* Prescriptions
* Medical Documents

### Supported File Types

```text
PDF
JPG
JPEG
PNG
```

### File Size

Maximum file size:

```text
10 MB
```

Uploaded files are stored in:

```text
uploads/reports/
```

The database stores the file information and associates the report with the patient.

### Report Access

| Role    | Upload |           View |       Download |
| ------- | -----: | -------------: | -------------: |
| Patient |  ✅ Own |          ✅ Own |          ✅ Own |
| Doctor  |      ❌ | ✅ Own Patients | ✅ Own Patients |
| Staff   |      ❌ |          ✅ All |          ✅ All |
| Admin   |      ❌ |          ✅ All |          ✅ All |

---

## 🔗 Database Relationships

### User Relationships

```text
User
 ├── Doctor
 ├── Staff
 └── Patient
```

Each profile can be linked with its corresponding user account using `user_id`.

### Doctor & Patient

```text
Doctor
   │
   └── Patients
```

A patient is assigned to a doctor using `doctor_id`.

### Appointments

```text
Patient ─── Appointment ─── Doctor
```

### Prescriptions

```text
Patient ─── Prescription ─── Doctor
```

### Reports

```text
Patient
   │
   └── Patient Reports
```

---

## 🛡️ Role-Based Access Control

The system uses role-based restrictions to control access to protected resources.

Example:

```text
Admin
 ├── Manage Doctors
 ├── Manage Staff
 ├── Manage Patients
 └── Access All Records

Doctor
 ├── Access Own Patients
 ├── Manage Relevant Appointments
 ├── Create Prescriptions
 └── Access Own Patients' Reports

Staff
 ├── Access Authorized Patient Data
 ├── Access Appointments
 └── Access Reports

Patient
 ├── Access Own Profile
 ├── Access Own Appointments
 ├── Access Own Prescriptions
 └── Upload/View Own Reports
```

---

## 🔍 Search, Filtering & Pagination

The system supports API-level searching, filtering, and pagination.

Examples:

```http
GET /patients?search=Ali
GET /patients?doctor_id=2
GET /patients?skip=0&limit=10
```

Doctor search:

```http
GET /doctors?search=Ali
GET /doctors?specialization=Cardiology
GET /doctors?email=doctor@example.com
```

Staff search/filter:

```http
GET /staff?search=Ali
GET /staff?designation=Manager
GET /staff?skip=0&limit=10
```

---

## 🧰 Tech Stack

### Backend

* Python
* FastAPI
* SQLAlchemy
* Pydantic

### Database

* PostgreSQL

### Authentication

* JWT
* OAuth2 Password Flow
* Password Hashing

### Database Migrations

* Alembic

### File Management

* FastAPI `UploadFile`
* Local file storage

### API Documentation

* Swagger UI
* OpenAPI

---

## 📁 Project Structure

```text
hospital_management/
│
├── app/
│   ├── api/
│   │   ├── auth.py
│   │   ├── doctor.py
│   │   ├── patient.py
│   │   ├── staff.py
│   │   ├── appointment.py
│   │   ├── prescription.py
│   │   └── report.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   │
│   ├── crud/
│   │   ├── user.py
│   │   ├── doctor.py
│   │   ├── patient.py
│   │   ├── staff.py
│   │   ├── appointment.py
│   │   ├── prescription.py
│   │   └── report.py
│   │
│   ├── models/
│   │   ├── user.py
│   │   ├── doctor.py
│   │   ├── patient.py
│   │   ├── staff.py
│   │   ├── appointment.py
│   │   ├── prescription.py
│   │   └── report.py
│   │
│   └── schemas/
│       ├── user.py
│       ├── doctor.py
│       ├── patient.py
│       ├── staff.py
│       ├── appointment.py
│       ├── prescription.py
│       └── report.py
│
├── alembic/
├── uploads/
│   └── reports/
│
├── .env
├── alembic.ini
├── requirements.txt
└── main.py
```

---

## ⚙️ Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hospital_management
```

### 2. Create Virtual Environment

```bash
python -m venv hospital_env
```

Activate it on Windows:

```bash
hospital_env\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file:

```env
DATABASE_URL=your_database_url

JWT_SECRET_KEY=your_secret_key
ALGORITHM=HS256

ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### 5. Run Database Migration

```bash
alembic upgrade head
```

### 6. Start the Server

```bash
uvicorn main:app --reload
```

---

## 📚 API Documentation

After starting the server, Swagger documentation is available at:

```text
http://127.0.0.1:8000/docs
```

Alternative ReDoc documentation:

```text
http://127.0.0.1:8000/redoc
```

---

## 🔒 Security

The system implements:

* JWT authentication
* Password hashing
* Role-based authorization
* Protected endpoints
* User/profile linking
* Patient data restrictions
* Doctor-specific patient restrictions
* File type validation
* File size validation
* Secure report access

---

## 📌 Current Development Status

| Module                        | Status     |
| ----------------------------- | ---------- |
| Authentication & JWT          | ✅ Complete |
| Role-Based Access Control     | ✅ Complete |
| Doctor Management             | ✅ Complete |
| Staff Management              | ✅ Complete |
| Patient Management            | ✅ Complete |
| Search / Filter / Pagination  | ✅ Complete |
| Appointment Management        | ✅ Complete |
| Prescription Management       | ✅ Complete |
| Patient Reports / File Upload | ✅ Complete |
| Production Optimization       | 🔄 Planned |
| Future BRD Modules            | 🔄 Planned |

---

## 🔮 Future Enhancements

Possible future improvements include:

* Production deployment
* Cloud file storage
* Email notifications
* Appointment reminders
* Advanced medical history
* Audit logging
* Automated backups
* API rate limiting
* Performance optimization
* Docker deployment
* CI/CD pipeline

---

## 👨‍💻 Project

**Hospital Management System**

Backend developed using **FastAPI + PostgreSQL + SQLAlchemy**, with authentication, authorization, medical management modules, appointment handling, prescriptions, and patient document management.
