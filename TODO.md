# Fix Approve/Disapprove "Record not found" Bug

## Plan Steps:
- [x] 1. Create TODO.md with approved plan steps
- [x] 2. Read AdminDashboard.jsx contents (already done)
- [x] 3. Edit handleApprove function: Change query to student_form_submissions table
- [x] 4. Edit handleNotApprove function: Same change for non-eligible
- [x] 5. Add fetchStudents() refresh after successful approve/disapprove
- [ ] 6. Test the functionality
- [ ] 7. Mark complete and attempt_completion

**Status**: Code changes implemented. Test approve/disapprove buttons in AdminDashboard to confirm "Record not found" is fixed. Records should now move from student_form_submissions → eligible_students/non_eligible_students.

