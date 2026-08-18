<p align="center">
  <img src="https://img.icons8.com/color/96/000000/hospital-building.png" alt="MediCore Logo" width="80" height="80"/>
</p>

<h1 align="center">🏥 MediCore - Hospital Management System</h1>

<p align="center">
  <strong>A complete, role-based Hospital Management System built with FastAPI & PostgreSQL</strong>
</p>

<p align="center">
  <a href="https://medicore-care.netlify.app">
    <img src="https://img.shields.io/badge/Frontend-Live%20Demo-0b2438?style=for-the-badge&logo=netlify&logoColor=white" alt="Frontend Demo"/>
  </a>
  <a href="https://hospital-management-lmfv.onrender.com">
    <img src="https://img.shields.io/badge/Backend-Live%20API-168c88?style=for-the-badge&logo=render&logoColor=white" alt="Backend API"/>
  </a>
  <a href="https://hospital-management-lmfv.onrender.com/docs">
    <img src="https://img.shields.io/badge/API-Docs%20(Swagger)-blue?style=for-the-badge&logo=swagger" alt="Swagger Docs"/>
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.14-blue?style=flat-square&logo=python"/>
  <img src="https://img.shields.io/badge/FastAPI-0.139.0-009688?style=flat-square&logo=fastapi"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql"/>
  <img src="https://img.shields.io/badge/SQLAlchemy-2.0.51-red?style=flat-square&logo=sqlalchemy"/>
  <img src="https://img.shields.io/badge/JWT-Authentication-black?style=flat-square&logo=jsonwebtokens"/>
  <img src="https://img.shields.io/badge/Deployed-Render%20&%20Netlify-brightgreen?style=flat-square&logo=render"/>
</p>

---

## 🚀 **Live Demos**

| Frontend (Netlify) | Backend (Render) | Swagger Docs |
|--------------------|------------------|--------------|
| [medicore-care.netlify.app](https://medicore-care.netlify.app) | [hospital-management-lmfv.onrender.com](https://hospital-management-lmfv.onrender.com) | [Interactive API Docs](https://hospital-management-lmfv.onrender.com/docs) |

---

## 🌟 **Key Features**

### 🔐 **Authentication & Authorization**
- JWT-based authentication (Access + Refresh Tokens)
- Role-based access control (`Admin`, `Doctor`, `Staff`, `Patient`)
- Secure password hashing with `bcrypt`
- Protected endpoints with role validation

### 👥 **Role-Based Dashboards**
- **Admin**: Full control over doctors, staff, patients, appointments, prescriptions, reports
- **Doctor**: Manage own patients, appointments, prescriptions, and reports
- **Staff**: Search patients, update appointments, and manage reports
- **Patient**: Own profile, appointments, prescriptions, and report uploads

### 📅 **Appointment Management**
- Request appointments with date, time, and reason
- Status tracking: `Scheduled` → `Confirmed` → `Completed` → `Cancelled` → `No-Show`
- Doctor and patient-specific access control

### 💊 **Prescription Management**
- Doctors can create and edit prescriptions
- Fields: Medicine, Dosage, Frequency, Duration, Instructions, Date
- Each prescription linked to both patient and doctor

### 📄 **Medical Reports & File Upload**
- Patients can upload reports (PDF, JPG, JPEG, PNG)
- Max file size: `10 MB`
- Role-based access: Patients (own), Doctors (own patients), Staff/Admin (all)
- Files stored in `uploads/reports/` directory

### 🔍 **Search, Filter & Pagination**
- Search patients, doctors, staff by name/email
- Filter doctors by specialization
- Filter staff by designation
- Pagination support with `skip` & `limit`

---

## 🛠️ **Tech Stack**

| Category        | Technology |
|-----------------|------------|
| Backend         | Python 3.14, FastAPI 0.139.0 |
| Database        | PostgreSQL 16, SQLAlchemy 2.0.51 |
| Authentication  | JWT, OAuth2 Password Flow, bcrypt |
| Migrations      | Alembic 1.18.5 |
| File Management | FastAPI `UploadFile`, local storage |
| API Docs        | Swagger UI, ReDoc |
| Deployment      | Render (Backend), Netlify (Frontend) |

---

## 📂 **Project Structure**

```
hospital_management/
├── app/
│   ├── api/                     # Route handlers (auth, doctor, patient, etc.)
│   ├── core/                    # Config, database, security
│   ├── crud/                    # Database operations
│   ├── models/                  # SQLAlchemy models
│   └── schemas/                 # Pydantic schemas
├── alembic/                     # Database migrations
├── uploads/reports/             # Uploaded medical reports
├── .env                         # Environment variables
├── alembic.ini                  # Alembic config
├── requirements.txt             # Python dependencies
└── main.py                      # FastAPI application entry point
```

---

## 🔧 **Installation & Setup**

### 1️⃣ Clone the repository
```bash
git clone <your-repo-url>
cd hospital_management
```

### 2️⃣ Create and activate virtual environment
```bash
python -m venv hospital_env
# Windows
hospital_env\Scripts\activate
# Mac/Linux
source hospital_env/bin/activate
```

### 3️⃣ Install dependencies
```bash
pip install -r requirements.txt
```

### 4️⃣ Configure environment variables (`.env`)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/hospital_db
JWT_SECRET_KEY=your_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### 5️⃣ Run database migrations
```bash
alembic upgrade head
```

### 6️⃣ Start the server
```bash
uvicorn main:app --reload
```

Server will run at `http://localhost:8000`

---

## 📚 **API Documentation**

Once the server is running, access interactive docs at:

- **Swagger UI** → `http://localhost:8000/docs`
- **ReDoc** → `http://localhost:8000/redoc`

---

## 🔒 **Security Features**

- JWT with Access & Refresh tokens
- Password hashing with `bcrypt`
- Role-based authorization (`require_role` middleware)
- User-profile linking via `user_id`
- Patient data isolation (doctor can only see own patients)
- File type and size validation for uploads
- Secure report access based on user role

---

## 🚀 **Deployment**

This project is currently deployed live:

- **Backend**: [Render](https://render.com) → `https://hospital-management-lmfv.onrender.com`
- **Frontend**: [Netlify](https://netlify.com) → `https://medicore-care.netlify.app`

---

## 📌 **Project Status**

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
| Production Deployment         | ✅ Complete |

---

## 🔮 **Future Enhancements**

- Cloud file storage (AWS S3 / Cloudinary)
- Email notifications & appointment reminders
- Advanced medical history & audit logs
- API rate limiting & performance optimization
- Docker containerization
- CI/CD pipeline with GitHub Actions

---

## 👨‍💻 **Developer**

Maintained by **Owais** | [GitHub](https://github.com) | [Live Demo](https://medicore-care.netlify.app)

---

<p align="center">
  <strong>Made with ❤️ using FastAPI & PostgreSQL</strong>
</p>
