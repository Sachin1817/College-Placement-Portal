<div align="center">
  <h1>🎓 Campus Placement Portal</h1>
  <p><i>A robust, data-dense, full-stack recruitment portal built to manage college training and placement drives.</i></p>

  [![Python](https://img.shields.io/badge/Python-3.13-blue.svg)](https://www.python.org/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791.svg)](https://www.postgresql.org/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](#)
</div>

---

## 🌟 Overview

The **Campus Placement Portal** is high-integrity institutional software designed to streamline the placement process for students, recruiters, and college administrators. It handles everything from student eligibility tracking and application evaluation to scheduling interviews and computing placement statistics.

---

## 🚀 Features & Highlights

- **Anti-Harvester Protection**: Registrations for companies start in `pending` status. Recruiters **cannot post drives** or access student data until approved by an administrator.
- **Double-Enforced Eligibility**: Eligibility criteria (CGPA, backlogs, branch, graduation year) are checked **server-side** on every application, preventing client-side manipulation.
- **Resume Magic-Number Sniffing**: Resume uploads strictly accept **PDF files (5MB max)**. The backend verifies the `%PDF` file header signature to prevent malicious uploads.
- **Brute-Force Rate Limiting**: All auth endpoints (register, login) are heavily rate-limited using `SlowAPI`.
- **Transactional Integrity**: Multi-step operations (like selecting an applicant and updating student placement status) run inside single SQLAlchemy transactions.

---

## 🛠️ Technology Stack

| Domain | Technologies |
| :--- | :--- |
| **Backend** | Python 3.13, FastAPI, SQLAlchemy 2.0 (asyncio), Alembic, Pydantic v2 |
| **Database** | PostgreSQL (Production) / SQLite with aiosqlite (Local Development) |
| **Security** | JWT (`python-jose`), `bcrypt` hashing, SlowAPI rate-limiting |
| **Frontend** | React 19, Vite, React Router v7, Plain CSS (Custom Design) |

---

## 📂 API Surface Catalog

### Authentication & Users
| Method | Endpoint | Allowed Role | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register/student` | Public | Register a student profile. |
| **POST** | `/api/auth/register/company` | Public | Register a company profile. |
| **POST** | `/api/auth/login` | Public | Sign in and retrieve JWT Bearer token. |
| **GET** | `/api/auth/me/company` | Company | Get logged-in company details. |

### Students
| Method | Endpoint | Allowed Role | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/students/me` | Student | Retrieve own academic profile. |
| **PUT** | `/api/students/me` | Student | Update own profile details. |
| **POST** | `/api/students/me/resume` | Student | Upload and verify resume PDF. |

### Drives & Applications
| Method | Endpoint | Allowed Role | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/drives` | Approved Company | Publish a new job recruitment drive. |
| **GET** | `/api/drives` | Authenticated | List all active job drives. |
| **GET** | `/api/eligibility/:driveId` | Student | Check own eligibility status. |
| **POST** | `/api/applications/:driveId` | Student | Submit job application. |
| **PATCH** | `/api/applications/:id/status` | Company | Update candidate status. |

### Interviews & Stats
| Method | Endpoint | Allowed Role | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/interviews/:driveId` | Company | Schedule an interview round. |
| **GET** | `/api/stats/overview` | Public | Fetch overall analytics. |

### Admin
| Method | Endpoint | Allowed Role | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/admin/companies/pending` | Admin | View recruiter approval queue. |
| **PATCH** | `/api/admin/companies/:id/approve` | Admin | Approve recruiter profile. |

---

## 💻 Getting Started (Local Development)

### 1️⃣ Prerequisites
- **Python 3.13**
- **Node.js (v18+)** and npm

### 2️⃣ Backend Setup
```bash
# Navigate to the project directory
cd Campus-Placement-Portal

# Initialize and activate virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
# source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run database migrations
$env:PYTHONPATH="." # For Windows PowerShell
alembic -c backend/alembic.ini upgrade head

# Start the server
python backend/run.py
```
> **Note**: FastAPI will run on `http://127.0.0.1:8000`. API Docs available at `/docs`.

**Promoting the First Admin:**
Since there is no admin registration endpoint for safety, register a normal user via the frontend, then promote them using the CLI:
```bash
$env:PYTHONPATH="."
python backend/promote_admin.py <registered_user_email>
```

### 3️⃣ Frontend Setup
```bash
# Navigate to frontend folder
cd frontend

# Install packages
npm install

# Start the development server
npm run dev
```
> **Note**: Vite runs on `http://localhost:5173`. Proxies are pre-configured to route `/api` to the backend.

---

## 🌐 Production Deployment

### Server & API
Host the backend on platforms like **Render, Railway, or Heroku**. 
For self-hosting behind Nginx:
```bash
gunicorn -k uvicorn.workers.UvicornWorker backend.app.main:app --bind 127.0.0.1:8000
```

### Database
Provision a PostgreSQL instance (e.g., Supabase, Render). Configure the `DATABASE_URL` environment variable.

### File Uploads (Scale Path)
Currently, resumes save to the local disk. For ephemeral environments (Heroku/Render), configure an S3 bucket (using `boto3`) and store object URLs instead of local paths.

### Environment Variables
```env
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname
JWT_SECRET=your_super_secret_key
CORS_ORIGINS=["https://your-domain.edu"]
```

---

<div align="center">
  <p>Built with ❤️ for educational excellence.</p>
</div>
