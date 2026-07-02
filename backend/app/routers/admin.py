from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.database import get_db
from backend.app.models import User, Company, Student
from backend.app.schemas import CompanyResponse, StudentResponse, UserResponse
from backend.app.auth import require_role

router = APIRouter()

@router.get("/companies/pending", response_model=list[CompanyResponse])
async def list_pending_companies(
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists all company registration profiles that are currently pending admin approval.
    """
    result = await db.execute(
        select(Company)
        .where(Company.status == "pending")
        .options(selectinload(Company.user))
    )
    return result.scalars().all()


@router.get("/students/unverified", response_model=list[StudentResponse])
async def list_unverified_students(
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists all student profiles where the associated user account is not yet verified.
    """
    result = await db.execute(
        select(Student)
        .join(User)
        .where(User.is_verified == False)
        .options(selectinload(Student.user))
    )
    return result.scalars().all()


@router.patch("/companies/{id}/approve", response_model=CompanyResponse)
async def approve_company(
    id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Approves a company HR registration, allowing them to post recruitment drives.
    Updates both the company status to 'approved' and the user's is_verified flag to True in a single transaction.
    """
    # 1. Fetch Company
    result = await db.execute(
        select(Company)
        .where(Company.id == id)
        .options(selectinload(Company.user))
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found."
        )

    # 2. Update status and verify user in a single transaction
    try:
        company.status = "approved"
        if company.user:
            company.user.is_verified = True
        
        await db.commit()
        res = await db.execute(
            select(Company)
            .where(Company.id == company.id)
            .options(selectinload(Company.user))
        )
        return res.scalar_one()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve company: {str(e)}"
        )


@router.patch("/companies/{id}/reject", response_model=CompanyResponse)
async def reject_company(
    id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Rejects a company HR registration.
    Updates the company status to 'rejected' in a single transaction.
    """
    result = await db.execute(
        select(Company)
        .where(Company.id == id)
        .options(selectinload(Company.user))
    )
    company = result.scalar_one_or_none()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company profile not found."
        )

    try:
        company.status = "rejected"
        if company.user:
            company.user.is_verified = False
            
        await db.commit()
        res = await db.execute(
            select(Company)
            .where(Company.id == company.id)
            .options(selectinload(Company.user))
        )
        return res.scalar_one()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reject company: {str(e)}"
        )


@router.patch("/students/{id}/verify", response_model=StudentResponse)
async def verify_student(
    id: int,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Verifies a student account (sets the associated User's is_verified flag to True).
    """
    result = await db.execute(
        select(Student)
        .where(Student.id == id)
        .options(selectinload(Student.user))
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )

    try:
        if student.user:
            student.user.is_verified = True
        
        await db.commit()
        res = await db.execute(
            select(Student)
            .where(Student.id == student.id)
            .options(selectinload(Student.user))
        )
        return res.scalar_one()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify student user: {str(e)}"
        )
