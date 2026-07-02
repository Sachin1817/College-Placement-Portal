import os
import asyncio
import httpx
import pytest
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

# Set env var before importing app
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_placement.db"
os.environ["DATABASE_URL"] = TEST_DATABASE_URL

from backend.app.config import settings
settings.DATABASE_URL = TEST_DATABASE_URL

from backend.app.main import app
from backend.app.database import Base, get_db
from backend.app.models import User, Student, Company, Drive, Application
from backend.app.auth import hash_password

# Setup async testing engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def override_get_db():
    async with TestingSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

app.dependency_overrides[get_db] = override_get_db

async def run_integration_flow():
    # 1. Setup DB
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    try:
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
            # === REGISTER STUDENT ===
            student_payload = {
                "email": "teststudent@college.edu",
                "password": "password123",
                "full_name": "John Doe",
                "roll_number": "CS101",
                "branch": "CSE",
                "graduation_year": 2026,
                "cgpa": 8.5,
                "active_backlogs": 0,
                "phone": "9876543210",
                "skills": ["Python", "SQL"]
            }
            res = await ac.post("/api/auth/register/student", json=student_payload)
            if res.status_code != 201:
                print("Registration failed with status", res.status_code)
                print("Response body:", res.text)
            assert res.status_code == 201
            student_data = res.json()
            assert student_data["roll_number"] == "CS101"
            assert student_data["placed"] is False

            # === REGISTER COMPANY ===
            company_payload = {
                "email": "hr@google.com",
                "password": "password456",
                "company_name": "Google",
                "website": "https://google.com",
                "hr_contact_name": "Alice Smith",
                "hr_contact_phone": "1234567890"
            }
            res = await ac.post("/api/auth/register/company", json=company_payload)
            assert res.status_code == 201
            company_data = res.json()
            assert company_data["company_name"] == "Google"
            assert company_data["status"] == "pending"

            # === REGISTER ADMIN & APPROVE COMPANY ===
            async with TestingSessionLocal() as session:
                admin_user = User(
                    email="admin@college.edu",
                    password_hash=hash_password("admin123"),
                    role="admin",
                    is_verified=True
                )
                session.add(admin_user)
                await session.commit()

            # Login admin
            admin_login = await ac.post("/api/auth/login", data={
                "username": "admin@college.edu",
                "password": "admin123"
            })
            assert admin_login.status_code == 200
            admin_token = admin_login.json()["access_token"]
            headers_admin = {"Authorization": f"Bearer {admin_token}"}

            # List pending companies
            pending_res = await ac.get("/api/admin/companies/pending", headers=headers_admin)
            assert pending_res.status_code == 200
            pending_list = pending_res.json()
            assert len(pending_list) >= 1
            company_id = pending_list[0]["id"]

            # Approve company
            approve_res = await ac.patch(f"/api/admin/companies/{company_id}/approve", headers=headers_admin)
            assert approve_res.status_code == 200
            assert approve_res.json()["status"] == "approved"

            # === LOGIN COMPANY & POST DRIVE ===
            company_login = await ac.post("/api/auth/login", data={
                "username": "hr@google.com",
                "password": "password456"
            })
            company_token = company_login.json()["access_token"]
            headers_company = {"Authorization": f"Bearer {company_token}"}

            # Create placement drive
            deadline = (datetime.utcnow() + timedelta(days=5)).isoformat()
            drive_payload = {
                "role_title": "Software Engineer Intern",
                "description": "Looking for talented backend engineers.",
                "package_lpa": 25.0,
                "min_cgpa": 8.0,
                "max_backlogs": 0,
                "eligible_branches": ["CSE", "ECE"],
                "eligible_grad_years": [2026],
                "application_deadline": deadline,
                "is_active": True
            }
            drive_res = await ac.post("/api/drives", json=drive_payload, headers=headers_company)
            assert drive_res.status_code == 201
            drive_data = drive_res.json()
            drive_id = drive_data["id"]

            # === LOGIN STUDENT, CHECK ELIGIBILITY & APPLY ===
            student_login = await ac.post("/api/auth/login", data={
                "username": "teststudent@college.edu",
                "password": "password123"
            })
            student_token = student_login.json()["access_token"]
            headers_student = {"Authorization": f"Bearer {student_token}"}

            # Check eligibility (eligibility check is positive but application requires resume upload)
            eligibility_res = await ac.get(f"/api/eligibility/{drive_id}", headers=headers_student)
            assert eligibility_res.status_code == 200
            assert eligibility_res.json()["eligible"] is True

            # Apply to drive (fails because resume is missing)
            app_fail_res = await ac.post(f"/api/applications/{drive_id}", headers=headers_student)
            assert app_fail_res.status_code == 400
            assert "resume" in app_fail_res.json()["detail"].lower()

            # Upload mock resume PDF
            pdf_content = b"%PDF-1.4 mock pdf data"
            files = {"file": ("resume.pdf", pdf_content, "application/pdf")}
            resume_res = await ac.post("/api/students/me/resume", files=files, headers=headers_student)
            assert resume_res.status_code == 200
            assert resume_res.json()["resume_path"] is not None

            # Apply again (succeeds)
            app_success_res = await ac.post(f"/api/applications/{drive_id}", headers=headers_student)
            assert app_success_res.status_code == 201
            app_id = app_success_res.json()["id"]

            # Try duplicate application (fails)
            dup_res = await ac.post(f"/api/applications/{drive_id}", headers=headers_student)
            assert dup_res.status_code == 400

            # === SELECTION TRANSACTION ===
            select_res = await ac.patch(f"/api/applications/{app_id}/status", json={"status": "selected"}, headers=headers_company)
            assert select_res.status_code == 200
            assert select_res.json()["status"] == "selected"

            # Check student is placed = True (transaction check)
            student_profile_res = await ac.get("/api/students/me", headers=headers_student)
            assert student_profile_res.status_code == 200
            assert student_profile_res.json()["placed"] is True

            # === STATS CHECK ===
            stats_res = await ac.get("/api/stats/overview")
            assert stats_res.status_code == 200
            stats_data = stats_res.json()
            assert stats_data["total_students"] == 1
            assert stats_data["total_placed"] == 1
            assert stats_data["overall_placement_rate"] == 100.0
            assert len(stats_data["top_offers"]) == 1
            assert stats_data["top_offers"][0]["package_lpa"] == 25.0
            assert stats_data["top_offers"][0]["student_name"] == "John Doe"

    finally:
        # Clean up database
        async with test_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        await test_engine.dispose()
        if os.path.exists("./test_placement.db"):
            os.remove("./test_placement.db")

def test_portal_flow():
    asyncio.run(run_integration_flow())
