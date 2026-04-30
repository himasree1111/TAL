# TODO - Search Fix Implementation

## Task
Fix the search functionality in Admin Dashboard > Manage Beneficiaries:
- When search bar has text: show ONLY forms matching that word/letter (bypass all other filters)
- When search bar is empty: show ALL forms (no filtering) - just like usual

## Implementation Steps

### Step 1: Modify filteredStudents logic
- Update the filteredStudents useMemo to bypass other filters when searchQuery has content
- When searchQuery is empty, show all students (remove other filter restrictions)

### Step 2: Test the implementation
- Verify search works correctly
- Verify empty search shows all forms

## Files to Edit
- src/AdminDashboard.jsx

## Completion Criteria
- Search with text shows only matching forms
- Empty search shows all forms
