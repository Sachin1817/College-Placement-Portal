from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.database import get_db
from backend.app.models import User, Student, Company, Drive
from backend.app.schemas import StudentResponse
from backend.app.auth import get_current_user, require_role
from backend.app.eligibility import check_student_eligibility

router = APIRouter()

@router.get("/{driveId}")
async def check_my_eligibility(
    driveId: int,
    current_user: User = Depends(require_role(["student"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Checks the eligibility of the currently logged-in student for a specific placement drive.
    Returns { eligible: bool, reasons: list[str] }
    """
    # 1. Fetch Student profile
    student_res = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = student_res.scalar_one_or_none()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )

    # 2. Fetch Drive
    drive_res = await db.execute(select(Drive).where(Drive.id == driveId))
    drive = drive_res.scalar_one_or_none()
    if not drive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Placement drive not found."
        )

    # 3. Perform eligibility check
    return check_student_eligibility(student, drive)


@router.get("/drive/{driveId}/eligible-students", response_model=list[StudentResponse])
async def list_eligible_students(
    driveId: int,
    current_user: User = Depends(require_role(["company", "admin"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns a list of all students who satisfy the eligibility criteria for a given drive.
    If requested by a company user, ownership of the drive is verified.
    """
    # 1. Fetch Drive
    drive_res = await db.execute(select(Drive).where(Drive.id == driveId))
    drive = drive_res.scalar_one_or_none()
    if not drive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Placement drive not found."
        )

    # 2. Authorize Company ownership
    if current_user.role == "company":
        company_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
        company = company_res.scalar_one_or_none()
        if not company or drive.company_id != company.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view information for this placement drive."
            )

    # 3. Fetch all students (exclude placed, or include them? The eligibility checker excludes placed)
    students_res = await db.execute(
        select(Student)
        .options(selectinload(Student.user))
    )
    all_students = students_res.scalars().all()

    # 4. Filter eligible students
    eligible_students = []
    for student in all_students:
        res = check_student_eligibility(student, drive)
        if res["eligible"]:
            eligible_students.append(student)

    return eligible_students
