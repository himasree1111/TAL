/**
 * Validate password strength.
 * @param {string} value - Password to validate
 * @returns {string[]} Array of error messages (empty if valid)
 */
export function validatePassword(value) {
  const errors = [];
  if (!/[a-z]/.test(value)) errors.push("Must include a lowercase letter");
  if (!/[A-Z]/.test(value)) errors.push("Must include an uppercase letter");
  if (!/[0-9]/.test(value)) errors.push("Must include a number");
  if (!/[@$!%*?&]/.test(value))
    errors.push("Must include a special character (@$!%*?&)");
  if (value.length < 8)
    errors.push("Must be at least 8 characters long");
  return errors;
}

/**
 * Validate a person's name.
 * @param {string} value - Name to validate
 * @returns {string} Error message or empty string if valid
 */
export function validateName(value) {
  if (!value.trim()) return "Full name is required";
  if (!/^[A-Za-z\s]+$/.test(value))
    return "Name must contain only letters and spaces";
  if (value.trim().length < 2)
    return "Name must be at least 2 characters";
  return "";
}

/**
 * Validate email format.
 * @param {string} value - Email to validate
 * @returns {string} Error message or empty string if valid
 */
export function validateEmail(value) {
  if (!value) return "Email is required";
  if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value))
    return "Please enter a valid email address";
  return "";
}

/**
 * Validation utilities extracted from studentform.js
 * Pure functions for field validation and type conversion.
 */

/**
 * Validate a single form field and return an error message (or empty string if valid).
 * @param {string} name - field name
 * @param {string} value - field value
 * @param {string} [userRole] - "volunteer" or "student"
 * @returns {string} error message or ""
 */
export function validateField(name, value, userRole = "volunteer") {
  // Name fields: only alphabets and spaces allowed
  if (name === "first_name" || name === "last_name" || name === "middle_name") {
    if (!value) return `${name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} is required`;
    if (!/^[a-zA-Z\s]+$/.test(value)) {
      return "Only alphabets and spaces are allowed";
    }
    return "";
  }

  // Phone fields (exactly 10 digits)
  if (name === "contact" || name === "whatsapp" || name === "volunteer_contact") {
    if (!value || !/^\d{10}$/.test(value)) {
      return "Must be exactly 10 digits";
    }
    return "";
  }

  // Student number (optional, but if present must be 10 digits)
  if (name === "student_contact") {
    if (!value) return "";
    if (!/^\d{10}$/.test(value)) return "Must be exactly 10 digits (if entered)";
    return "";
  }

  // Account number: digits only, 10-18 digits
  if (name === "account_no") {
    if (!value) return "";
    if (!/^\d{10,18}$/.test(value)) {
      return "Account number must be 10 to 18 digits";
    }
    return "";
  }

  // IFSC: 4 letters + 0 + 6 numbers
  if (name === "ifsc_code") {
    if (!value) return "";
    if (!/^[A-Z]{4}0[0-9]{6}$/.test(value)) {
      return "Enter a valid IFSC code";
    }
    return "";
  }

  // Email
  if (name === "email") {
    if (!value) return "Email is required";
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) return "Enter a valid email address";
    return "";
  }

  // Age
  if (name === "age") {
    if (value !== "" && (Number.isNaN(Number(value)) || Number(value) < 6)) {
      return "Age must be at least 6";
    }
    return "";
  }

  // Percentage fields
  if (name === "prev_percent" || name === "present_percent") {
    if (!value) return `${name === "prev_percent" ? "Previous Year" : "Present Year"} Percentage is required`;
    if (!/^\d+(\.\d+)?$/.test(value)) {
      return "Only numbers and decimal points are allowed";
    }
    const numValue = parseFloat(value);
    if (numValue < 0 || numValue > 100) {
      return "Percentage must be between 0 and 100";
    }
    return "";
  }

  // Fee structure
  if (name === "fee_structure") {
    if (!value) return "Tuition Fee is required";
    if (!/^[\d\s.,₹$£€¥\-\s]+$/.test(value)) {
      return "Only numbers, currency symbols, and punctuation are allowed";
    }
    return "";
  }

  // Volunteer name
  if (name === "volunteer_name") {
    if (!value && userRole !== "student") return "Volunteer name is required";
    if (value && !/^[a-zA-Z\s]+$/.test(value)) {
      return "Only alphabets and spaces are allowed";
    }
    return "";
  }

  return "";
}

/**
 * Convert a YES/NO string or boolean to a boolean value.
 * @param {string|boolean} val
 * @returns {boolean}
 */
export function yesNoToBool(val) {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.toUpperCase() === "YES";
  return false;
}
