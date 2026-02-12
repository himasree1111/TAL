import { getPriorityColor, getAlertIcon, calculateFeeStatus } from "../utils/dashboardUtils";

describe("getPriorityColor", () => {
  test("high returns red", () => {
    expect(getPriorityColor("high")).toBe("#e74c3c");
  });
  test("medium returns orange", () => {
    expect(getPriorityColor("medium")).toBe("#f39c12");
  });
  test("low returns green", () => {
    expect(getPriorityColor("low")).toBe("#27ae60");
  });
  test("unknown returns grey", () => {
    expect(getPriorityColor("unknown")).toBe("#ccc");
  });
  test("undefined returns grey", () => {
    expect(getPriorityColor(undefined)).toBe("#ccc");
  });
});

describe("getAlertIcon", () => {
  test("workshop returns book emoji", () => {
    expect(getAlertIcon("workshop")).toBe("\uD83D\uDCDA");
  });
  test("deadline returns alarm emoji", () => {
    expect(getAlertIcon("deadline")).toBe("\u23F0");
  });
  test("fee returns money bag emoji", () => {
    expect(getAlertIcon("fee")).toBe("\uD83D\uDCB0");
  });
  test("event returns target emoji", () => {
    expect(getAlertIcon("event")).toBe("\uD83C\uDFAF");
  });
  test("broadcast returns megaphone emoji", () => {
    expect(getAlertIcon("broadcast")).toBe("\uD83D\uDCE2");
  });
  test("default returns bell emoji", () => {
    expect(getAlertIcon("other")).toBe("\uD83D\uDD14");
  });
});

describe("calculateFeeStatus", () => {
  test("N/A when totalFee is 0", () => {
    const result = calculateFeeStatus({ fee_structure: "0" }, []);
    expect(result.displayStatus).toBe("N/A");
    expect(result.totalFee).toBe(0);
  });

  test("N/A when fee_structure is empty", () => {
    const result = calculateFeeStatus({ fee_structure: "" }, []);
    expect(result.displayStatus).toBe("N/A");
  });

  test("Paid when fully paid", () => {
    const student = { fee_structure: "10000" };
    const payments = [{ amount: 10000 }];
    const result = calculateFeeStatus(student, payments);
    expect(result.displayStatus).toBe("Paid");
    expect(result.dueAmount).toBe(0);
  });

  test("Not Paid when no payments", () => {
    const student = { fee_structure: "50000" };
    const result = calculateFeeStatus(student, []);
    expect(result.displayStatus).toBe("Not Paid");
    expect(result.dueAmount).toBe(50000);
  });

  test("Partially Paid with some payments", () => {
    const student = { fee_structure: "10000" };
    const payments = [{ amount: 3000 }, { amount: 2000 }];
    const result = calculateFeeStatus(student, payments);
    expect(result.displayStatus).toBe("Partially Paid");
    expect(result.totalPaid).toBe(5000);
    expect(result.dueAmount).toBe(5000);
  });

  test("dueAmount clamped at 0 when overpaid", () => {
    const student = { fee_structure: "5000" };
    const payments = [{ amount: 6000 }];
    const result = calculateFeeStatus(student, payments);
    expect(result.dueAmount).toBe(0);
    expect(result.displayStatus).toBe("Paid");
  });

  test("handles null student", () => {
    const result = calculateFeeStatus(null, []);
    expect(result.totalFee).toBe(0);
    expect(result.displayStatus).toBe("N/A");
  });

  test("handles null payments array", () => {
    const student = { fee_structure: "10000" };
    const result = calculateFeeStatus(student, null);
    expect(result.totalPaid).toBe(0);
    expect(result.displayStatus).toBe("Not Paid");
  });

  test("handles non-numeric fee_structure", () => {
    const student = { fee_structure: "not-a-number" };
    const result = calculateFeeStatus(student, []);
    expect(result.totalFee).toBe(0);
    expect(result.displayStatus).toBe("N/A");
  });

  test("handles mixed valid/invalid payment amounts", () => {
    const student = { fee_structure: "10000" };
    const payments = [{ amount: 3000 }, { amount: "invalid" }, { amount: 2000 }];
    const result = calculateFeeStatus(student, payments);
    expect(result.totalPaid).toBe(5000);
  });
});
