import { validateField, yesNoToBool } from "../utils/validation";

describe("validateField", () => {
  // Name fields
  test("first_name: empty returns required error", () => {
    expect(validateField("first_name", "")).toMatch(/required/i);
  });
  test("first_name: valid name returns empty", () => {
    expect(validateField("first_name", "Alice")).toBe("");
  });
  test("first_name: numbers rejected", () => {
    expect(validateField("first_name", "Alice123")).toMatch(/alphabets/i);
  });
  test("last_name: special chars rejected", () => {
    expect(validateField("last_name", "O'Brien")).toMatch(/alphabets/i);
  });

  // Phone fields
  test("contact: valid 10 digits", () => {
    expect(validateField("contact", "9876543210")).toBe("");
  });
  test("contact: less than 10 digits fails", () => {
    expect(validateField("contact", "12345")).toMatch(/10 digits/i);
  });
  test("whatsapp: letters rejected", () => {
    expect(validateField("whatsapp", "abcdefghij")).toMatch(/10 digits/i);
  });
  test("volunteer_contact: valid", () => {
    expect(validateField("volunteer_contact", "1234567890")).toBe("");
  });

  // Student contact (optional)
  test("student_contact: empty is ok", () => {
    expect(validateField("student_contact", "")).toBe("");
  });
  test("student_contact: invalid length fails", () => {
    expect(validateField("student_contact", "123")).toMatch(/10 digits/i);
  });

  // Account number
  test("account_no: empty is ok (optional)", () => {
    expect(validateField("account_no", "")).toBe("");
  });
  test("account_no: valid 12 digits", () => {
    expect(validateField("account_no", "123456789012")).toBe("");
  });
  test("account_no: too short fails", () => {
    expect(validateField("account_no", "12345")).toMatch(/10 to 18/i);
  });

  // IFSC
  test("ifsc_code: empty is ok", () => {
    expect(validateField("ifsc_code", "")).toBe("");
  });
  test("ifsc_code: valid SBIN0001234", () => {
    expect(validateField("ifsc_code", "SBIN0001234")).toBe("");
  });
  test("ifsc_code: invalid format", () => {
    expect(validateField("ifsc_code", "INVALID")).toMatch(/valid IFSC/i);
  });

  // Email
  test("email: empty returns required", () => {
    expect(validateField("email", "")).toMatch(/required/i);
  });
  test("email: valid email", () => {
    expect(validateField("email", "test@example.com")).toBe("");
  });
  test("email: invalid email", () => {
    expect(validateField("email", "notanemail")).toMatch(/valid email/i);
  });

  // Age
  test("age: empty is ok", () => {
    expect(validateField("age", "")).toBe("");
  });
  test("age: 18 is valid", () => {
    expect(validateField("age", "18")).toBe("");
  });
  test("age: 3 is too young", () => {
    expect(validateField("age", "3")).toMatch(/at least 6/i);
  });

  // Percentages
  test("prev_percent: empty returns required", () => {
    expect(validateField("prev_percent", "")).toMatch(/required/i);
  });
  test("prev_percent: 85.5 is valid", () => {
    expect(validateField("prev_percent", "85.5")).toBe("");
  });
  test("present_percent: 105 is out of range", () => {
    expect(validateField("present_percent", "105")).toMatch(/between 0 and 100/i);
  });

  // Fee structure
  test("fee_structure: empty returns required", () => {
    expect(validateField("fee_structure", "")).toMatch(/required/i);
  });
  test("fee_structure: valid amount with currency", () => {
    expect(validateField("fee_structure", "₹50,000")).toBe("");
  });
  test("fee_structure: letters rejected", () => {
    expect(validateField("fee_structure", "fifty thousand")).toMatch(/numbers/i);
  });

  // Volunteer name
  test("volunteer_name: required for volunteer role", () => {
    expect(validateField("volunteer_name", "", "volunteer")).toMatch(/required/i);
  });
  test("volunteer_name: not required for student role", () => {
    expect(validateField("volunteer_name", "", "student")).toBe("");
  });

  // Unknown field
  test("unknown field returns empty", () => {
    expect(validateField("unknown_field", "anything")).toBe("");
  });
});

describe("yesNoToBool", () => {
  test("YES returns true", () => {
    expect(yesNoToBool("YES")).toBe(true);
  });
  test("yes (lowercase) returns true", () => {
    expect(yesNoToBool("yes")).toBe(true);
  });
  test("NO returns false", () => {
    expect(yesNoToBool("NO")).toBe(false);
  });
  test("boolean true passthrough", () => {
    expect(yesNoToBool(true)).toBe(true);
  });
  test("boolean false passthrough", () => {
    expect(yesNoToBool(false)).toBe(false);
  });
  test("null returns false", () => {
    expect(yesNoToBool(null)).toBe(false);
  });
  test("undefined returns false", () => {
    expect(yesNoToBool(undefined)).toBe(false);
  });
});
