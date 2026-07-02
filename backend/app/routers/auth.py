from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.database import get_db
from backend.app.models import User, Student, Company
from backend.app.schemas import (
    StudentRegistrationRequest,
    CompanyRegistrationRequest,
    Token,
    UserResponse,
    StudentResponse,
    CompanyResponse
)
from backend.app.auth import (
    hash_password,
    verify_password,
    create_access_token,
    limiter,
    require_role
)

router = APIRouter()

@router.post("/register/student", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register_student(request: Request, body: StudentRegistrationRequest, db: AsyncSession = Depends(get_db)):
    """
    Registers a new student. Creates both a User and a Student profile in a single transaction.
    """
    # 1. Check if email is already taken
    email_check = await db.execute(select(User).where(User.email == body.email))
    if email_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )

    # 2. Check if roll number is already taken
    roll_check = await db.execute(select(Student).where(Student.roll_number == body.roll_number))
    if roll_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Roll number is already registered"
        )

    # 3. Create user and student inside a transaction
    try:
        new_user = User(
            email=body.email,
            password_hash=hash_password(body.password),
            role="student",
            is_verified=False  # Student needs verification by Admin
        )
        db.add(new_user)
        await db.flush()  # Get new_user.id

        new_student = Student(
            user_id=new_user.id,
            full_name=body.full_name,
            roll_number=body.roll_number,
            branch=body.branch,
            graduation_year=body.graduation_year,
            cgpa=body.cgpa,
            active_backlogs=body.active_backlogs,
            phone=body.phone,
            skills=body.skills,
            placed=False
        )
        db.add(new_student)
        await db.commit()
        
        # Eager load the user relationship for response serialization
        res = await db.execute(
            select(Student)
            .where(Student.id == new_student.id)
            .options(selectinload(Student.user))
        )
        return res.scalar_one()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/register/company", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register_company(request: Request, body: CompanyRegistrationRequest, db: AsyncSession = Depends(get_db)):
    """
    Registers a new company HR recruiter. Creates User and Company profiles in a single transaction.
    The company starts in 'pending' status and cannot create drives until approved by Admin.
    """
    # 1. Check if email is already taken
    email_check = await db.execute(select(User).where(User.email == body.email))
    if email_check.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )

    # 2. Create user and company HR profile
    try:
        new_user = User(
            email=body.email,
            password_hash=hash_password(body.password),
            role="company",
            is_verified=False  # Company verified status maps to approval
        )
        db.add(new_user)
        await db.flush()

        new_company = Company(
            user_id=new_user.id,
            company_name=body.company_name,
            website=body.website,
            hr_contact_name=body.hr_contact_name,
            hr_contact_phone=body.hr_contact_phone,
            status="pending"  # Admin must approve
        )
        db.add(new_company)
        await db.commit()

        # Eager load the user relationship for response serialization
        res = await db.execute(
            select(Company)
            .where(Company.id == new_company.id)
            .options(selectinload(Company.user))
        )
        return res.scalar_one()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """
    Standard login endpoint returning a JWT bearer token.
    Accepts standard OAuth2 password request form fields (username is the email).
    """
    # Query user
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Exclude admins or companies/students verification logs if necessary?
    # The prompt doesn't state they can't login, but company approval and student verification will block actions server-side.
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role, "user_id": user.id}
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me/company", response_model=CompanyResponse)
async def get_company_profile(
    current_user: User = Depends(require_role(["company"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the company profile for the logged-in company user.
    """
    result = await db.execute(
        select(Company)
        .where(Company.user_id == current_user.id)
        .options(selectinload(Company.user))
    )
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found."
        )
    return company
