from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from datetime import datetime

from backend.app.database import get_db
from backend.app.models import User, Student, Company, Drive, InterviewRound, Application, InterviewResult
from backend.app.schemas import InterviewRoundResponse, InterviewRoundCreate, InterviewResultResponse, InterviewResultCreate
from backend.app.auth import get_current_user, require_role

router = APIRouter()

@router.post("/{driveId}", response_model=InterviewRoundResponse, status_code=status.HTTP_201_CREATED)
async def schedule_interview_round(
    driveId: int,
    body: InterviewRoundCreate,
    current_user: User = Depends(require_role(["company"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Schedules a new interview round for a specific placement drive.
    Validates company ownership.
    """
    # 1. Fetch Company profile
    company_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = company_res.scalar_one_or_none()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company profile not found."
        )

    # 2. Fetch Drive
    drive_res = await db.execute(select(Drive).where(Drive.id == driveId))
    drive = drive_res.scalar_one_or_none()
    if not drive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Placement drive not found."
        )

    # 3. Ownership check
    if drive.company_id != company.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to schedule interviews for this placement drive."
        )

    # 4. Save interview round
    new_round = InterviewRound(
        drive_id=driveId,
        round_name=body.round_name,
        round_order=body.round_order,
        scheduled_at=body.scheduled_at,
        venue=body.venue,
        is_online=body.is_online,
        meeting_link=body.meeting_link
    )
    
    try:
        db.add(new_round)
        await db.commit()
        await db.refresh(new_round)
        return new_round
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to schedule interview round: {str(e)}"
        )


@router.get("/mine", response_model=list[InterviewRoundResponse])
async def get_my_interview_schedule(
    current_user: User = Depends(require_role(["student"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists all upcoming/scheduled interview rounds for the logged-in student,
    based on the drives they have applied to.
    """
    # 1. Fetch Student profile
    student_res = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = student_res.scalar_one_or_none()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )

    # 2. Find all drive IDs where the student applied (and applications aren't rejected)
    app_res = await db.execute(
        select(Application.drive_id)
        .where(Application.student_id == student.id, Application.status != "rejected")
    )
    applied_drive_ids = app_res.scalars().all()

    if not applied_drive_ids:
        return []

    # 3. Fetch interview rounds for those drives
    rounds_res = await db.execute(
        select(InterviewRound)
        .where(InterviewRound.drive_id.in_(applied_drive_ids))
        .options(selectinload(InterviewRound.drive).selectinload(Drive.company))
        .order_by(InterviewRound.scheduled_at.asc())
    )
    return rounds_res.scalars().all()
