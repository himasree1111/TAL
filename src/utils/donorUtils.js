/**
 * Donor dashboard utility functions extracted from DonorDashboard.js
 */

/**
 * Calculate total donated from donations array
 * @param {Array} donations
 * @returns {number}
 */
export function calcTotalDonated(donations) {
  return (donations || []).reduce(
    (sum, d) => sum + (parseFloat(d.amount) || 0),
    0
  );
}

/**
 * Count currently sponsored students
 * @param {Array} sponsoredStudents - donor_mapping records
 * @returns {number}
 */
export function calcStudentsSponsored(sponsoredStudents) {
  return (sponsoredStudents || []).filter((s) => s.is_current_sponsor).length;
}

/**
 * Calculate annual goal (at least 100k or actual donations)
 * @param {number} thisYearTotal
 * @returns {number}
 */
export function calcAnnualGoal(thisYearTotal) {
  return Math.max(thisYearTotal, 100000);
}

/**
 * Calculate donation progress percentage (capped at 100)
 * @param {number} thisYearTotal
 * @param {number} annualGoal
 * @returns {number}
 */
export function calcDonationPercentage(thisYearTotal, annualGoal) {
  if (annualGoal <= 0) return 0;
  return Math.min(100, Math.round((thisYearTotal / annualGoal) * 100));
}
