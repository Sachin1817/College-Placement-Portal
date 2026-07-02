from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator
from datetime import datetime
from typing import List, Optional, Any

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    role: str = Field(..., description="Role must be 'student', 'company', or 'admin'")

    @field_validator("role")
    def validate_role(cls, v):
        if v not in ["student", "company", "admin"]:
            raise ValueError("Role must be one of: student, company, admin")
        return v

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters long")

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None


# --- Student Profile Schemas ---
class StudentBase(BaseModel):
    full_name: str
    roll_number: str
    branch: str
    graduation_year: int
    cgpa: float = Field(..., ge=0.0, le=10.0, description="CGPA must be between 0.0 and 10.0")
    active_backlogs: int = Field(default=0, ge=0, description="Active backlogs must be non-negative")
    phone: str
    skills: List[str] = []

class StudentCreate(StudentBase):
    pass

class StudentResponse(StudentBase):
    id: int
    user_id: int
    resume_path: Optional[str] = None
    placed: bool
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True

class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    branch: Optional[str] = None
    graduation_year: Optional[int] = None
    cgpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    active_backlogs: Optional[int] = Field(None, ge=0)
    phone: Optional[str] = None
    skills: Optional[List[str]] = None


# --- Company Profile Schemas ---
class CompanyBase(BaseModel):
    company_name: str
    website: str
    hr_contact_name: str
    hr_contact_phone: str

class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: int
    user_id: int
    status: str
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# --- Registration Wrapper Schemas ---
class StudentRegistrationRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    roll_number: str
    branch: str
    graduation_year: int
    cgpa: float = Field(..., ge=0.0, le=10.0)
    active_backlogs: int = Field(default=0, ge=0)
    phone: str
    skills: List[str] = []

class CompanyRegistrationRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    company_name: str
    website: str
    hr_contact_name: str
    hr_contact_phone: str


# --- Drive Schemas ---
class DriveBase(BaseModel):
    role_title: str
    description: str
    package_lpa: float = Field(..., gt=0.0)
    min_cgpa: float = Field(..., ge=0.0, le=10.0)
    max_backlogs: int = Field(..., ge=0)
    eligible_branches: List[str]
    eligible_grad_years: List[int]
    application_deadline: datetime
    is_active: bool = True

class DriveCreate(DriveBase):
    pass

class DriveResponse(DriveBase):
    id: int
    company_id: int
    company: Optional[CompanyResponse] = None

    class Config:
        from_attributes = True


# --- Application Schemas ---
class ApplicationResponse(BaseModel):
    id: int
    student_id: int
    drive_id: int
    status: str
    applied_at: datetime
    student: Optional[StudentResponse] = None
    drive: Optional[DriveResponse] = None

    class Config:
        from_attributes = True

class ApplicationStatusUpdate(BaseModel):
    status: str = Field(..., description="Status must be 'applied', 'shortlisted', 'rejected', or 'selected'")

    @field_validator("status")
    def validate_status(cls, v):
        if v not in ["applied", "shortlisted", "rejected", "selected"]:
            raise ValueError("Status must be one of: applied, shortlisted, rejected, selected")
        return v


# --- Interview Round Schemas ---
class InterviewRoundBase(BaseModel):
    round_name: str
    round_order: int
    scheduled_at: datetime
    venue: str
    is_online: bool = False
    meeting_link: Optional[str] = None

class InterviewRoundCreate(InterviewRoundBase):
    pass

class InterviewRoundResponse(InterviewRoundBase):
    id: int
    drive_id: int

    class Config:
        from_attributes = True


# --- Interview Result Schemas ---
class InterviewResultBase(BaseModel):
    cleared: bool
    remarks: Optional[str] = None

class InterviewResultCreate(InterviewResultBase):
    application_id: int
    round_id: int

class InterviewResultResponse(InterviewResultBase):
    id: int
    application_id: int
    round_id: int

    class Config:
        from_attributes = True


# --- Stats Schemas ---
class BranchStat(BaseModel):
    branch: str
    total_students: int
    placed_students: int
    placement_rate: float

class TopOffer(BaseModel):
    student_name: str
    branch: str
    company_name: str
    role_title: str
    package_lpa: float

class StatsResponse(BaseModel):
    total_students: int
    total_companies: int
    total_drives: int
    total_placed: int
    overall_placement_rate: float
    branch_stats: List[BranchStat]
    top_offers: List[TopOffer]
