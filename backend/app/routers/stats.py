from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import func

from backend.app.database import get_db
from backend.app.models import Student, Company, Drive, Application
from backend.app.schemas import StatsResponse, BranchStat, TopOffer

router = APIRouter()

@router.get("/overview", response_model=StatsResponse)
async def get_overview_statistics(db: AsyncSession = Depends(get_db)):
    """
    Computes and returns public placement statistics for the dashboard.
    Does not require authentication.
    """
    # 1. General counts
    student_count_res = await db.execute(select(func.count(Student.id)))
    total_students = student_count_res.scalar() or 0

    company_count_res = await db.execute(select(func.count(Company.id)).where(Company.status == "approved"))
    total_companies = company_count_res.scalar() or 0

    drive_count_res = await db.execute(select(func.count(Drive.id)))
    total_drives = drive_count_res.scalar() or 0

    placed_count_res = await db.execute(select(func.count(Student.id)).where(Student.placed == True))
    total_placed = placed_count_res.scalar() or 0

    # 2. Overall placement rate
    overall_placement_rate = 0.0
    if total_students > 0:
        overall_placement_rate = round((total_placed / total_students) * 100, 2)

    # 3. Branch-wise placement rates
    # Fetch all students to calculate in-memory (highly compatible across SQLite and Postgres)
    students_res = await db.execute(select(Student))
    students = students_res.scalars().all()

    branch_map = {}
    for s in students:
        branch = s.branch.upper().strip()
        if branch not in branch_map:
            branch_map[branch] = {"total": 0, "placed": 0}
        branch_map[branch]["total"] += 1
        if s.placed:
            branch_map[branch]["placed"] += 1

    branch_stats = []
    for branch, counts in branch_map.items():
        rate = 0.0
        if counts["total"] > 0:
            rate = round((counts["placed"] / counts["total"]) * 100, 2)
        branch_stats.append(
            BranchStat(
                branch=branch,
                total_students=counts["total"],
                placed_students=counts["placed"],
                placement_rate=rate
            )
        )
    # Sort branches alphabetically
    branch_stats.sort(key=lambda x: x.branch)

    # 4. Top package offers
    # Query selected applications joined with student and drive
    top_apps_res = await db.execute(
        select(Application)
        .where(Application.status == "selected")
        .options(
            selectinload(Application.student),
            selectinload(Application.drive).selectinload(Drive.company)
        )
    )
    selected_apps = top_apps_res.scalars().all()
    
    # Sort in memory by package_lpa desc, limit to 5
    selected_apps.sort(key=lambda app: app.drive.package_lpa, reverse=True)
    top_offers_list = selected_apps[:5]

    top_offers = []
    for app in top_offers_list:
        top_offers.append(
            TopOffer(
                student_name=app.student.full_name,
                branch=app.student.branch.upper().strip(),
                company_name=app.drive.company.company_name,
                role_title=app.drive.role_title,
                package_lpa=app.drive.package_lpa
            )
        )

    return StatsResponse(
        total_students=total_students,
        total_companies=total_companies,
        total_drives=total_drives,
        total_placed=total_placed,
        overall_placement_rate=overall_placement_rate,
        branch_stats=branch_stats,
        top_offers=top_offers
    )
