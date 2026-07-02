/**
 * Client-side eligibility checker mirroring the backend Python engine.
 * Used for instant UI feedback when listing drives.
 */
export function checkEligibility(student, drive) {
  if (!student || !drive) {
    return { eligible: false, reasons: ["Profile or drive information missing."] };
  }

  const reasons = [];

  // 1. Placed status check
  if (student.placed) {
    reasons.append ? reasons.push("You are already placed.") : reasons.push("You have already been placed in a company.");
  }

  // 2. Drive active status
  if (!drive.is_active) {
    reasons.push("Recruitment drive is no longer active.");
  }

  // 3. Deadline check
  const deadlineDate = new Date(drive.application_deadline);
  if (new Date() > deadlineDate) {
    reasons.push(`Application deadline (${deadlineDate.toLocaleString()}) has passed.`);
  }

  // 4. CGPA check
  if (student.cgpa < drive.min_cgpa) {
    reasons.push(`Your CGPA (${student.cgpa.toFixed(2)}) is below the required ${drive.min_cgpa.toFixed(2)}.`);
  }

  // 5. Backlogs check
  if (student.active_backlogs > drive.max_backlogs) {
    reasons.push(`Your active backlogs (${student.active_backlogs}) exceed the maximum allowed (${drive.max_backlogs}).`);
  }

  // 6. Branch check
  const studentBranch = (student.branch || "").toUpperCase().trim();
  const eligibleBranches = (drive.eligible_branches || []).map(b => b.toUpperCase().trim());
  if (eligibleBranches.length > 0 && !eligibleBranches.includes(studentBranch)) {
    reasons.push(`Your branch '${student.branch}' is not eligible. Eligible: ${drive.eligible_branches.join(", ")}.`);
  }

  // 7. Graduation year check
  const studentGradYear = parseInt(student.graduation_year);
  const eligibleGradYears = (drive.eligible_grad_years || []).map(y => parseInt(y));
  if (eligibleGradYears.length > 0 && !eligibleGradYears.includes(studentGradYear)) {
    reasons.push(`Your graduation year (${student.graduation_year}) is not eligible. Eligible: ${drive.eligible_grad_years.join(", ")}.`);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}
