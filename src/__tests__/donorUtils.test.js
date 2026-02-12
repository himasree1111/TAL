import {
  calcTotalDonated,
  calcStudentsSponsored,
  calcAnnualGoal,
  calcDonationPercentage,
} from "../utils/donorUtils";

describe("calcTotalDonated", () => {
  test("sums donation amounts", () => {
    const donations = [{ amount: 5000 }, { amount: 3000 }, { amount: 2000 }];
    expect(calcTotalDonated(donations)).toBe(10000);
  });

  test("handles empty array", () => {
    expect(calcTotalDonated([])).toBe(0);
  });

  test("handles null", () => {
    expect(calcTotalDonated(null)).toBe(0);
  });
});

describe("calcStudentsSponsored", () => {
  test("counts only current sponsors", () => {
    const students = [
      { is_current_sponsor: 1 },
      { is_current_sponsor: 0 },
      { is_current_sponsor: 1 },
    ];
    expect(calcStudentsSponsored(students)).toBe(2);
  });

  test("handles empty array", () => {
    expect(calcStudentsSponsored([])).toBe(0);
  });
});

describe("calcAnnualGoal", () => {
  test("returns 100k when donations less than 100k", () => {
    expect(calcAnnualGoal(50000)).toBe(100000);
  });

  test("returns actual when donations exceed 100k", () => {
    expect(calcAnnualGoal(200000)).toBe(200000);
  });

  test("returns 100k for zero", () => {
    expect(calcAnnualGoal(0)).toBe(100000);
  });
});

describe("calcDonationPercentage", () => {
  test("calculates percentage correctly", () => {
    expect(calcDonationPercentage(50000, 100000)).toBe(50);
  });

  test("caps at 100%", () => {
    expect(calcDonationPercentage(200000, 100000)).toBe(100);
  });

  test("returns 0 for zero goal", () => {
    expect(calcDonationPercentage(5000, 0)).toBe(0);
  });

  test("rounds to nearest integer", () => {
    expect(calcDonationPercentage(33333, 100000)).toBe(33);
  });
});
