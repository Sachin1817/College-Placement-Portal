from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.app.database import get_db
from backend.app.models import User, Company, Drive
from backend.app.schemas import DriveResponse, DriveCreate
from backend.app.auth import get_current_user, require_role

router = APIRouter()

@router.post("", response_model=DriveResponse, status_code=status.HTTP_201_CREATED)
async def create_drive(
    body: DriveCreate,
    current_user: User = Depends(require_role(["company"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new job recruitment drive.
    Only approved companies are allowed to post drives.
    """
    # 1. Fetch company profile
    result = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company profile not found for this user."
        )

    # 2. Enforce the admin approval check
    if company.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Cannot post drives. Your company status is currently '{company.status}'. Please wait for admin approval."
        )

    # 3. Create the drive
    new_drive = Drive(
        company_id=company.id,
        role_title=body.role_title,
        description=body.description,
        package_lpa=body.package_lpa,
        min_cgpa=body.min_cgpa,
        max_backlogs=body.max_backlogs,
        eligible_branches=body.eligible_branches,
        eligible_grad_years=body.eligible_grad_years,
        application_deadline=body.application_deadline,
        is_active=body.is_active
    )
    
    try:
        db.add(new_drive)
        await db.commit()
        await db.refresh(new_drive)
        
        # Load company relation for response
        res = await db.execute(
            select(Drive)
            .where(Drive.id == new_drive.id)
            .options(selectinload(Drive.company).selectinload(Company.user))
        )
        return res.scalar_one()
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create placement drive: {str(e)}"
        )


@router.get("", response_model=list[DriveResponse])
async def list_active_drives(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists all active recruitment drives. Accessible by any authenticated user.
    """
    result = await db.execute(
        select(Drive)
        .where(Drive.is_active == True)
        .options(selectinload(Drive.company).selectinload(Company.user))
        .order_by(Drive.application_deadline.asc())
    )
    return result.scalars().all()


@router.patch("/{id}/close", response_model=DriveResponse)
async def close_drive(
    id: int,
    current_user: User = Depends(require_role(["company"])),
    db: AsyncSession = Depends(get_db)
):
    """
    Closes a recruitment drive (sets is_active to False).
    A company can only close its own drives.
    """
    # 1. Fetch company profile
    company_res = await db.execute(select(Company).where(Company.user_id == current_user.id))
    company = company_res.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Company profile not found."
        )

    # 2. Fetch the drive
    drive_res = await db.execute(
        select(Drive)
        .where(Drive.id == id)
        .options(selectinload(Drive.company))
    )
    drive = drive_res.scalar_one_or_none()
    
    if not drive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Placement drive not found."
        )

    # 3. Check ownership
    if drive.company_id != company.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to modify this placement drive."
        )

    # 4. Close drive
    drive.is_active = False
    try:
        await db.commit()
        await db.refresh(drive)
        return drive
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to close drive: {str(e)}"
        )
