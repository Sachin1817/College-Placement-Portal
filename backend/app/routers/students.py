import os
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.database import get_db
from backend.app.models import User, Student
from backend.app.schemas import StudentResponse, StudentUpdate
from backend.app.auth import get_current_user, require_role
from backend.app.config import settings
from backend.app.utils import validate_pdf_resume

router = APIRouter()

@router.get("/me", response_model=StudentResponse)
async def get_student_profile(
    current_user: User = Depends(require_role(["student"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the student profile for the logged-in student user.
    """
    result = await db.execute(
        select(Student)
        .where(Student.user_id == current_user.id)
        .options(selectinload(Student.user))
    )
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )
    return student


@router.put("/me", response_model=StudentResponse)
async def update_student_profile(
    body: StudentUpdate,
    current_user: User = Depends(require_role(["student"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates student profile fields.
    """
    result = await db.execute(
        select(Student)
        .where(Student.user_id == current_user.id)
        .options(selectinload(Student.user))
    )
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )

    # Update profile fields if supplied
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(student, field, value)

    try:
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
            detail=f"Failed to update profile: {str(e)}"
        )


@router.post("/me/resume", response_model=StudentResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["student"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Validates and uploads the student resume in PDF format.
    Checks MIME type, file size, and the binary file signature.
    """
    # 1. Run header validation & size checks
    await validate_pdf_resume(file)

    # 2. Query student profile
    result = await db.execute(
        select(Student)
        .where(Student.user_id == current_user.id)
        .options(selectinload(Student.user))
    )
    student = result.scalar_one_or_none()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )

    # 3. Save file locally
    filename = f"student_{student.id}_resume.pdf"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)

    try:
        # Read uploaded file content and write to target path
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Update resume path in database
        # Store relative or absolute path. Let's store relative path or filename
        student.resume_path = f"/uploads/resumes/{filename}"
        
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
            detail=f"Failed to save resume: {str(e)}"
        )
