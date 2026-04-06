# Student Dashboard - Separate Placeholders for Document Upload

## Plan Breakdown (Approved) - ✅ COMPLETED

User task: Add separate placeholders in student dashboard document upload sections.

**Files:** src/studentdashboard.js

**Steps:**
- [x] Step 1: Update DOCUMENT_CATEGORIES array to include `placeholder` prop for each category. ✅
- [x] Step 2: In `renderDocumentUpload()`, use `category.placeholder` in text input. ✅
- [x] Step 3: Verified in code - placeholders now category-specific (e.g., "e.g. Fee Receipt 2024" for fee).
- [x] Step 4: Upload logic unchanged, works as before.

**Changes Summary:**
- DOCUMENT_CATEGORIES now has `placeholder` for each category.
- Document name input uses `placeholder={category.placeholder}` for fee/extracurricular.

**Test:** Run `npm start`, login as student, go to Documents tab - see separate placeholders per category.

**Task complete!** 🎉

