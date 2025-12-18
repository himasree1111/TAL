# Validation Implementation Plan

## Files to Update
- [x] src/register.js: Enhance password validation, add full name validation (only letters)
- [x] src/volunteerlogin.js: Add validations for sign-in (email/password) and sign-up (name/email/password)
- [x] src/adminlogin.js: Add validations for sign-in and sign-up
- [ ] src/donorlogin.js: Replace basic validations with full specs
- [ ] src/studentlogin.js: Add validations for sign-in and sign-up
- [ ] src/ResetPassword.js: Add password strength validation for new password

## Validation Rules
- Email: Required, regex ^[^\s@]+@[^\s@]+\.[^\s@]+$
- Password: Required, 8-64 chars, at least one lowercase, uppercase, number, special (!@#$%^&*), no spaces
- Full Name: Required during sign-up, only letters and spaces, min 2 chars

## Implementation Details
- Add validateEmail, validatePassword, validateName functions
- Use state for errors and touched fields
- Real-time validation on onChange/onBlur
- Prevent form submission if errors exist
- Display error messages below inputs
