import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VolunteerDashboard.css";
import supabase from "./supabaseClient";

export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [volunteerName, setVolunteerName] = useState("Volunteer");
  const [volunteerEmail, setVolunteerEmail] = useState("");
  const [lastFetch, setLastFetch] = useState(null);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    // Fetch logged-in volunteer data and forms from Supabase
    const fetchVolunteerData = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const user = data.session.user;
          const email = user.email || "";
          setVolunteerEmail(email);

          // Get the volunteer's name from user metadata or email
          const name = user.user_metadata?.name || user.email?.split("@")[0] || "Volunteer";
          setVolunteerName(name);

          // Fetch forms submitted by this volunteer
          await fetchForms(email);
        } else {
          // not logged in; stop loading and expose debug
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching volunteer data:", error);
        setLastFetch({ data: null, error: error?.message || String(error), fetchedAt: new Date().toISOString() });
        setLoading(false);
      }
    };

    fetchVolunteerData();
  }, []);

  const fetchForms = async (volunteerEmail) => {
    try {
      setLoading(true);
      // Fetch from backend with volunteer email filter
      const response = await fetch(`http://localhost:4000/students?volunteer_email=${encodeURIComponent(volunteerEmail)}`);
      const result = await response.json();

      // Save debug payload
      const sample = (result.students && result.students.length > 0) ? (({ id, full_name }) => ({ id, full_name }))(result.students[0]) : null;
      setLastFetch({ raw: result.students || null, error: result.success ? null : result.message, fetchedAt: new Date().toISOString(), summary: { count: (result.students || []).length, sample } });

      if (!result.success) {
        console.error("Error fetching forms:", result.message);
        setLoading(false);
        return;
      }

      // Transform the data to match the expected format
      // Backend fields: full_name, school_college, course_class_fee, age, etc.
      const transformedForms = (result.students || []).map((student, index) => ({
        id: student.id, // Use the actual database ID for operations
        displayId: index + 1, // Sequential display ID starting from 1
        title: student.full_name || 'Unknown Student',
        dateSubmitted: 'N/A', // Backend doesn't have created_at, set to N/A
        details: `Student: ${student.full_name || 'Unknown'}, Age: ${student.age || 'N/A'}, School: ${student.school_college || 'N/A'}, Class: ${student.course_class_fee || 'N/A'}`,
        dataForEdit: student // Store the full student data for editing
      }));

      setForms(transformedForms);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching forms:", error);
      setLastFetch({ data: null, error: error?.message || String(error), fetchedAt: new Date().toISOString() });
      setLoading(false);
    }
  };

  const handleFormClick = (id) => {
    setSelectedFormId(id);
  };

  const handleFillFormClick = () => {
    // Clear any existing edit data
    localStorage.removeItem("editFormData");
    window.location.href = "/studentform"; // or use navigate in real app
  };

  const handleDeleteClick = async (id) => {
    if(window.confirm("Are you sure you want to delete this form?")) {
      try {
        const { error } = await supabase
          .from("student_form_submissions")
          .delete()
          .eq("id", id);

        if (error) {
          console.error("Error deleting form:", error);
          alert("Error deleting form. Please try again.");
          return;
        }

        // Remove from local state
        setForms((prev) => prev.filter(form => form.id !== id));
        // If deleted form was selected, clear selection
        if (selectedFormId === id) setSelectedFormId(null);
      } catch (error) {
        console.error("Error deleting form:", error);
        alert("Error deleting form. Please try again.");
      }
    }
  };

  const handleEditClick = (form) => {
    // Save form data for edit in localStorage (or context/state management)
    localStorage.setItem("editFormData", JSON.stringify(form.dataForEdit));
    // Navigate to form page for editing
    window.location.href = "/studentform";
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Add non-persistent demo forms for local testing when DB returns no rows
  

  const selectedForm = forms.find(f => f.id === selectedFormId);
  
  // Calculate statistics
  const thisMonthForms = forms.filter(f => new Date(f.dateSubmitted).getMonth() === new Date().getMonth()).length;
  const lastMonthForms = forms.filter(f => {
    const formDate = new Date(f.dateSubmitted);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return formDate.getMonth() === lastMonth.getMonth() && formDate.getFullYear() === lastMonth.getFullYear();
  }).length;

  return (
    <div className="volunteer-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="profile">
            <h2>{volunteerName}</h2>
            <p>{volunteerEmail}</p>
          </div>
          
          {/* Statistics Cards */}
          <div className="stats">
            <div className="card">
              <h3>{thisMonthForms}</h3>
              <p>This Month</p>
            </div>
            <div className="card">
              <h3>{lastMonthForms}</h3>
              <p>Last Month</p>
            </div>
            <div className="card">
              <h3>{forms.length}</h3>
              <p>Total Forms</p>
            </div>
          </div>
        </div>
        
        <button className="sidebar-logout-btn" onClick={handleLogout}>Logout</button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header Section */}
        <div className="main-header">
          <button className="btn primary fill-form-btn" onClick={handleFillFormClick}>
            <span>+</span>
            New Form
          </button>
          
        </div>

        {/* Table Wrapper */}
        <div className="table-wrapper">
          {loading && (
            <div style={{padding: 16, color: '#6b7280'}}>Loading forms...</div>
          )}
          {!loading && forms.length === 0 && (
            <div style={{padding:16, textAlign:'center', color:'#6b7280'}}>
              <div>No submitted forms found for this volunteer.</div>
              <div style={{marginTop:8}}>If you expected forms, please ensure you're logged in or check the Supabase table for submissions.</div>
            </div>
          )}
          {/* Forms Table */}
          <table className="forms-table">
            <thead>
              <tr>
                <th>Form ID</th>
                <th>Title</th>
                <th>Date Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {forms.map(form => (
                <tr key={form.id} className={form.id === selectedFormId ? "selected" : ""}>
                  <td onClick={() => handleFormClick(form.id)}>{form.displayId}</td>
                  <td onClick={() => handleFormClick(form.id)}>{form.title}</td>
                  <td onClick={() => handleFormClick(form.id)}>{form.dateSubmitted}</td>
                  <td>
                    <button
                      className="btn primary small icon"
                      onClick={() => handleEditClick(form)}
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      className="btn danger small icon"
                      onClick={() => handleDeleteClick(form.id)}
                      title="Delete"
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Form Details Section */}
        {selectedForm && (
          <div className="form-details">
            <h2>{selectedForm.title}</h2>
            <p>{selectedForm.details}</p>
            <div className="form-actions">
              <button
                className="btn primary icon"
                onClick={() => handleEditClick(selectedForm)}
                title="Edit"
              >
                ✎
              </button>
              <button
                className="btn danger icon"
                onClick={() => handleDeleteClick(selectedForm.id)}
                title="Delete"
              >
                🗑
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}