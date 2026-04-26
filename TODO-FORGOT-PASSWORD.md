# TODO: Forgot Password for Student + Reset Page Fix

## Steps
- [x] **Step 1:** Update `src/adminlogin.js` — append `?role=admin` to the reset link redirectTo
- [x] **Step 2:** Update `src/studentlogin.js` — implement real `handleForgotPassword` with eligibility check and `?role=student`
- [x] **Step 3:** Rewrite `src/ResetPassword.js` — apply styling, password validation, show/hide toggles, role-aware redirect

