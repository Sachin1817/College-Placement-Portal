from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.database import get_db
from backend.app.models import User, Student, Company, Drive, Application
from backend.app.schemas import ApplicationResponse, ApplicationStatusUpdate
from backend.app.auth import get_current_user, require_role
from backend.app.eligibility import check_student_eligibility

router = APIRouter()

@router.post("/{driveId}", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_to_drive(
    driveId: int,
    current_user: User = Depends(require_role(["student"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Submits a job application for the logged-in student to a specific placement drive.
    Re-checks eligibility server-side and verifies that a resume has been uploaded.
    """
    # 1. Fetch Student profile
    student_res = await db.execute(
        select(Student)
        .where(Student.user_id == current_user.id)
        .options(selectinload(Student.user))
    )
    student = student_res.scalar_one_or_none()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )

    # 2. Check if resume is uploaded
    if not student.resume_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must upload a resume to your profile before applying to placement drives."
        )

    # 3. Fetch Placement Drive
    drive_res = await db.execute(select(Drive).where(Drive.id == driveId))
    drive = drive_res.scalar_one_or_none()
    if not drive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Placement drive not found."
        )

    # 4. Check if student has already applied
    app_check_res = await db.execute(
        select(Application)
        .where(Application.student_id == student.id, Application.drive_id == drive.id)
    )
    if app_check_res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted an application for this recruitment drive."
        )

    # 5. Server-side eligibility engine execution
    elig_check = check_student_eligibility(student, drive)
    if not elig_check["eligible"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "You do not meet the eligibility requirements for this drive.",
                "reasons": elig_check["reasons"]
            }
        )

    # 6. Save new application
    new_app = Application(
        student_id=student.id,
        drive_id=drive.id,
        status="applied"
    )
    
    try:
        db.add(new_app)
        await db.commit()
        
        # Reload with relationships
        res = await db.execute(
            select(Application)
            .where(Application.id == new_app.id)
            .options(
                selectinload(Application.student).selectinload(Student.user),
                selectinload(Application.drive).selectinload(Drive.company).selectinload(Company.user)
            )
        )
        return res.scalar_one()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit application: {str(e)}"
        )


@router.get("/mine", response_model=list[ApplicationResponse])
async def get_my_applications(
    current_user: User = Depends(require_role(["student"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves all applications submitted by the currently logged-in student.
    """
    student_res = await db.execute(select(Student).where(Student.user_id == current_user.id))
    student = student_res.scalar_one_or_none()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student profile not found."
        )

    result = await db.execute(
        select(Application)
        .where(Application.student_id == student.id)
        .options(
            selectinload(Application.student).selectinload(Student.user),
            selectinload(Application.drive).selectinload(Drive.company).selectinload(Company.user)
        )
        .order_by(Application.applied_at.desc())
    )
    return result.scalars().all()


@router.get("/drive/{driveId}", response_model=list[ApplicationResponse])
async def list_drive_applications(
    driveId: int,
    current_user: User = Depends(require_role(["company"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists all student applications submitted for a specific placement drive.
    Validates company ownership.
    """
    # 1. Fetch company profile
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
            detail="You are not authorized to view applications for this drive."
        )

    # 4. Fetch applications
    result = await db.execute(
        select(Application)
        .where(Application.drive_id == driveId)
        .options(
            selectinload(Application.student).selectinload(Student.user),
            selectinload(Application.drive).selectinload(Drive.company).selectinload(Company.user)
        )
        .order_by(Application.applied_at.desc())
    )
    return result.scalars().all()


@router.patch("/{id}/status", response_model=ApplicationResponse)
async def update_application_status(
    id: int,
    body: ApplicationStatusUpdate,
    current_user: User = Depends(require_role(["company"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates the status of a student application.
    If the status is set to 'selected', updates the student's status to placed=True
    as part of a single transaction.
    """
    # 1. Fetch Company profile
    company_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = company_res.scalar_one_or_none()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company profile not found."
        )

    # 2. Fetch Application
    app_res = await db.execute(
        select(Application)
        .where(Application.id == id)
        .options(
            selectinload(Application.student).selectinload(Student.user),
            selectinload(Application.drive)
        )
    )
    application = app_res.scalar_one_or_none()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found."
        )

    # 3. Ownership verification: does the drive belong to the company updating the application?
    if application.drive.company_id != company.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage this application."
        )

    # 4. Execute the update inside a single transaction block
    try:
        application.status = body.status
        
        # If student gets selected, set placed status to True
        if body.status == "selected":
            student = application.student
            student.placed = True
            
            # Reject all other pending applications for this placed student?
            # The prompt doesn't explicitly mandate automatically rejecting others, but does mention 'already-placed' checks.
            # We'll just set placed = True on student. Any future application checks will fail because placed is True.
        
        await db.commit()
        await db.refresh(application)
        
        # Reload with full relations
        res = await db.execute(
            select(Application)
            .where(Application.id == application.id)
            .options(
                selectinload(Application.student).selectinload(Student.user),
                selectinload(Application.drive).selectinload(Drive.company).selectinload(Company.user)
            )
        )
        return res.scalar_one()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update application status: {str(e)}"
        )
