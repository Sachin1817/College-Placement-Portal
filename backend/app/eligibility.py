from datetime import datetime
from typing import TypedDict, List
from backend.app.models import Student, Drive

class EligibilityResult(TypedDict):
    eligible: bool
    reasons: List[str]

def check_student_eligibility(student: Student, drive: Drive) -> EligibilityResult:
    """
    Centralized eligibility checker.
    Returns whether a student is eligible for a recruitment drive, along with reasons if ineligible.
    """
    reasons = []

    # 1. Drive active status
    if not drive.is_active:
        reasons.append("Recruitment drive is no longer active.")

    # 2. Application deadline check
    if datetime.utcnow() > drive.application_deadline:
        reasons.append(f"Application deadline ({drive.application_deadline.strftime('%Y-%m-%d %H:%M')}) has passed.")

    # 3. CGPA check (0 to 10 scale)
    if student.cgpa < drive.min_cgpa:
        reasons.append(f"Your CGPA ({student.cgpa:.2f}) is below the minimum required ({drive.min_cgpa:.2f}).")

    # 4. Backlog check
    if student.active_backlogs > drive.max_backlogs:
        reasons.append(f"Your active backlogs ({student.active_backlogs}) exceed the maximum allowed ({drive.max_backlogs}).")

    # 5. Branch eligibility (case-insensitive checking)
    eligible_branches_lower = [b.lower().strip() for b in drive.eligible_branches]
    student_branch_lower = student.branch.lower().strip()
    if student_branch_lower not in eligible_branches_lower:
        reasons.append(f"Your branch '{student.branch}' is not eligible for this drive. Eligible branches: {', '.join(drive.eligible_branches)}.")

    # 6. Graduation year check
    if student.graduation_year not in drive.eligible_grad_years:
        reasons.append(f"Your graduation year ({student.graduation_year}) is not eligible. Eligible years: {', '.join(map(str, drive.eligible_grad_years))}.")

    # 7. Placed status check
    if student.placed:
        reasons.append("You have already been placed in a company.")

    return {
        "eligible": len(reasons) == 0,
        "reasons": reasons
    }
