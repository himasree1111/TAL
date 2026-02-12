/**
 * Dashboard utility functions extracted from studentdashboard.js
 */

/**
 * Get color for notification priority
 * @param {string} priority - "high", "medium", "low"
 * @returns {string} hex color
 */
export function getPriorityColor(priority) {
  switch (priority) {
    case "high":
      return "#e74c3c";
    case "medium":
      return "#f39c12";
    case "low":
      return "#27ae60";
    default:
      return "#ccc";
  }
}

/**
 * Get emoji icon for alert type
 * @param {string} type - "workshop", "deadline", "fee", "event", "broadcast"
 * @returns {string} emoji character
 */
export function getAlertIcon(type) {
  switch (type) {
    case "workshop":
      return String.fromCodePoint(0x1F4DA);
    case "deadline":
      return String.fromCodePoint(0x23F0);
    case "fee":
      return String.fromCodePoint(0x1F4B0);
    case "event":
      return String.fromCodePoint(0x1F3AF);
    case "broadcast":
      return String.fromCodePoint(0x1F4E2);
    default:
      return String.fromCodePoint(0x1F514);
  }
}

/**
 * Calculate fee status from student data and payments
 * @param {object} student - student record with fee_structure
 * @param {Array} feePayments - array of fee payment records
 * @returns {{ totalFee: number, totalPaid: number, dueAmount: number, displayStatus: string }}
 */
export function calculateFeeStatus(student, feePayments) {
  const totalFee = student ? parseFloat(student.fee_structure) || 0 : 0;
  const totalPaid = (feePayments || []).reduce(
    (sum, fp) => sum + (parseFloat(fp.amount) || 0),
    0
  );
  const dueAmount = Math.max(0, totalFee - totalPaid);
  let displayStatus;
  if (totalFee === 0) {
    displayStatus = "N/A";
  } else if (dueAmount === 0) {
    displayStatus = "Paid";
  } else if (totalPaid === 0) {
    displayStatus = "Not Paid";
  } else {
    displayStatus = "Partially Paid";
  }
  return { totalFee, totalPaid, dueAmount, displayStatus };
}
