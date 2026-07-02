import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Float,
    DateTime,
    ForeignKey,
    JSON,
    UniqueConstraint,
    Index
)
from sqlalchemy.orm import relationship
from backend.app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "student", "company", "admin"
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    student_profile = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    company_profile = relationship("Company", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    full_name = Column(String, nullable=False)
    roll_number = Column(String, unique=True, index=True, nullable=False)
    branch = Column(String, nullable=False)
    graduation_year = Column(Integer, nullable=False)
    cgpa = Column(Float, nullable=False)
    active_backlogs = Column(Integer, default=0, nullable=False)
    phone = Column(String, nullable=False)
    resume_path = Column(String, nullable=True)
    skills = Column(JSON, default=list, nullable=False)  # List of strings
    placed = Column(Boolean, default=False, nullable=False)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    applications = relationship("Application", back_populates="student", cascade="all, delete-orphan")

    # Composite Index: branch + graduation_year
    __table_args__ = (
        Index("idx_students_branch_grad_year", "branch", "graduation_year"),
    )


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    company_name = Column(String, nullable=False)
    website = Column(String, nullable=False)
    hr_contact_name = Column(String, nullable=False)
    hr_contact_phone = Column(String, nullable=False)
    status = Column(String, default="pending", nullable=False)  # "pending", "approved", "rejected"

    # Relationships
    user = relationship("User", back_populates="company_profile")
    drives = relationship("Drive", back_populates="company", cascade="all, delete-orphan")


class Drive(Base):
    __tablename__ = "drives"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    role_title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    package_lpa = Column(Float, nullable=False)
    min_cgpa = Column(Float, nullable=False)
    max_backlogs = Column(Integer, nullable=False)
    eligible_branches = Column(JSON, default=list, nullable=False)  # List of strings
    eligible_grad_years = Column(JSON, default=list, nullable=False)  # List of integers
    application_deadline = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    company = relationship("Company", back_populates="drives")
    applications = relationship("Application", back_populates="drive", cascade="all, delete-orphan")
    interview_rounds = relationship("InterviewRound", back_populates="drive", cascade="all, delete-orphan")

    # Composite Index: is_active + application_deadline
    __table_args__ = (
        Index("idx_drives_active_deadline", "is_active", "application_deadline"),
    )


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    drive_id = Column(Integer, ForeignKey("drives.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String, default="applied", nullable=False)  # "applied", "shortlisted", "rejected", "selected"
    applied_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    # Relationships
    student = relationship("Student", back_populates="applications")
    drive = relationship("Drive", back_populates="applications")
    interview_results = relationship("InterviewResult", back_populates="application", cascade="all, delete-orphan")

    # Constraints and Indexes
    __table_args__ = (
        UniqueConstraint("student_id", "drive_id", name="uq_student_drive_application"),
        Index("idx_applications_student_id", "student_id"),
        Index("idx_applications_drive_id", "drive_id"),
    )


class InterviewRound(Base):
    __tablename__ = "interview_rounds"

    id = Column(Integer, primary_key=True, index=True)
    drive_id = Column(Integer, ForeignKey("drives.id", ondelete="CASCADE"), nullable=False)
    round_name = Column(String, nullable=False)
    round_order = Column(Integer, nullable=False)
    scheduled_at = Column(DateTime, nullable=False)
    venue = Column(String, nullable=False)
    is_online = Column(Boolean, default=False, nullable=False)
    meeting_link = Column(String, nullable=True)

    # Relationships
    drive = relationship("Drive", back_populates="interview_rounds")
    interview_results = relationship("InterviewResult", back_populates="interview_round", cascade="all, delete-orphan")


class InterviewResult(Base):
    __tablename__ = "interview_results"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    round_id = Column(Integer, ForeignKey("interview_rounds.id", ondelete="CASCADE"), nullable=False)
    cleared = Column(Boolean, default=False, nullable=False)
    remarks = Column(String, nullable=True)

    # Relationships
    application = relationship("Application", back_populates="interview_results")
    interview_round = relationship("InterviewRound", back_populates="interview_results")
