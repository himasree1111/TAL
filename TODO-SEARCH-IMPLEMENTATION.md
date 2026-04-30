# TODO - Real-time Search for Manage Beneficiaries

## Task
Add a real-time search button in Admin Dashboard > Manage Beneficiaries where admin can type name of student and find them instantly.

## Implementation Steps

### Step 1: Add search state
- Add `const [searchQuery, setSearchQuery] = useState("");` in the component state

### Step 2: Add search input UI
- Add a search input field in the Manage Beneficiaries section (above the filters table)
- Include a search icon for better UX

### Step 3: Update filteredStudents to include search filtering
- The filteredStudents memo already filters based on newFilters
- Add additional filtering based on searchQuery to filter by student name (contains search term)

### Step 4: Style the search input
- Add appropriate styling in AdminDashboard.css if needed

## Files to Edit
- src/AdminDashboard.jsx

## Completion Criteria
- Search input appears in Manage Beneficiaries section
- Typing in search box filters students in real-time
- Search works alongside existing filters (camp, education, achievements, etc.)
