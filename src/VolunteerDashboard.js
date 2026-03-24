import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVolunteer } from "./VolunteerContext";
import "./VolunteerDashboard.css";
import supabase from "./supabaseClient";

export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const { volunteer, loading: contextLoading, updateVolunteerData } = useVolunteer();
  const [forms, setForms] = useState([]);
  const [formsThisMonth, setFormsThisMonth] = useState(0);
  const [formsToday, setFormsToday] = useState(0);
  const [formsPreviously, setFormsPreviously] = useState(0);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [activeSection, setActiveSection] = useState("forms");
  const [settings, setSettings] = useState({ name: "", email: "", phone: "" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [loading, setLoading] = useState(true);
useEffect(() => {
  const fetchCounts = async () => {
    const now = new Date();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 👉 TODAY COUNT
    const { count: todayCount } = await supabase
      .from("student_form_submissions")
      .select("*", { count: "exact", head: true })
      .eq("volunteer_email", volunteer?.email) // optional filter
      .gte("created_at", startOfToday.toISOString());

    // 👉 MONTH COUNT
    const { count: monthCount } = await supabase
      .from("student_form_submissions")
      .select("*", { count: "exact", head: true })
      .eq("volunteer_email", volunteer?.email)
      .gte("created_at", startOfMonth.toISOString());

    // 👉 TOTAL COUNT
    const { count: totalCount } = await supabase
      .from("student_form_submissions")
      .select("*", { count: "exact", head: true })
      .eq("volunteer_email", volunteer?.email);

    // 👉 PREVIOUS = TOTAL - THIS MONTH
    const previousCount = (totalCount || 0) - (monthCount || 0);

    setFormsToday(todayCount || 0);
    setFormsThisMonth(monthCount || 0);
    setFormsPreviously(previousCount);
  };

  if (volunteer?.email) {
    fetchCounts();
  }
}, [volunteer]);
  useEffect(() => {
    if (!volunteer || contextLoading) {
      if (!contextLoading && !volunteer) {
        navigate("/coverpage");
      }
      return;
    }

    setSettings({
      name: volunteer.name,
      email: volunteer.email,
      phone: volunteer.phone
    });

    fetchForms(volunteer.email);
  }, [volunteer, contextLoading, navigate]);

  const fetchForms = async (volunteerEmail) => {
    setLoading(true);

    if (!volunteerEmail) {
      console.warn("fetchForms: volunteerEmail not set");
      setForms([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("student_form_submissions")
      .select(
        "id, first_name, last_name, camp_name, created_at, age, school, class, volunteer_email"
      )
      .eq("volunteer_email", volunteerEmail)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching forms:", error);
      setLoading(false);
      return;
    }

    const transformedForms = (data || []).map((submission, index) => ({
      id: submission.id,
      displayId: index + 1,
      title: `${submission.first_name} ${submission.last_name}`,
      campName: submission.camp_name || "-",
      dateSubmitted: new Date(submission.created_at)
        .toISOString()
        .split("T")[0],
      details: `Student: ${submission.first_name} ${submission.last_name}, Age: ${submission.age}, School: ${submission.school}, Class: ${submission.class}`,
      dataForEdit: submission
    }));

    setForms(transformedForms);

    // Compute new stats
    const now = new Date();
    const todayStr = now.toDateString();
    const thisMonthCount = transformedForms.filter(f => {
      const formDate = new Date(f.dateSubmitted);
      return formDate.getMonth() === now.getMonth() && formDate.getFullYear() === now.getFullYear();
    }).length;
    const todayCount = transformedForms.filter(f => new Date(f.dateSubmitted).toDateString() === todayStr).length;
    const previouslyCount = transformedForms.length - thisMonthCount;

    setFormsThisMonth(thisMonthCount);
    setFormsToday(todayCount);
    setFormsPreviously(previouslyCount);

    setLoading(false);
  };

  const handleFormClick = (id) => {
    setSelectedFormId(id);
  };

  const handleFillFormClick = () => {
    localStorage.removeItem("editFormData");
    navigate("/studentform");
  };

  const validatePhone = (value) => {
    if (!value) return "Phone number is required";
    if (!/^\d{10}$/.test(value)) return "Must be exactly 10 digits";
    return "";
  };

  const handleSaveSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!volunteer?.id) return;

    const phoneErr = validatePhone(settings.phone);
    if (phoneErr) {
      setPhoneError(phoneErr);
      setSettingsMessage("Please fix phone number");
      setSavingSettings(false);
      return;
    }

    setSavingSettings(true);
    setSettingsMessage("");
    const success = await updateVolunteerData(settings);
    if (success) {
      setSettingsMessage("Settings saved successfully!");
    } else {
      setSettingsMessage("Error saving settings. Please try again.");
    }
    setSavingSettings(false);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this form?")) return;

    const { error } = await supabase
      .from("student_form_submissions")
      .delete()
      .eq("id", parseInt(id));

    if (error) {
      alert("Error deleting form");
      return;
    }

    setForms((prev) => prev.filter((form) => form.id !== id));
    if (selectedFormId === id) setSelectedFormId(null);
  };

  const handleEditClick = (form) => {
    navigate(`/studentform/${form.id}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/coverpage");
  };

  const renderSettings = () => (
    <div className="settings-panel">
      <h2>Volunteer Settings</h2>
      <p>Update your profile information.</p>

      <form
        className="settings-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveSettings();
        }}
      >
        <div className="form-group">
          <label>Name</label>
          <input
            value={settings.name}
            onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Full name"
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            value={settings.email}
            onChange={(e) => setSettings((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Email address"
            type="email"
          />
        </div>

        <div className="form-row">
          <label>Phone</label>
            <input
              value={settings.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0,10);
                setSettings((prev) => ({ ...prev, phone: value }));
                setPhoneError(validatePhone(value));
              }}
              placeholder="Phone Number (10 digits)"
              type="tel"
              maxLength={10}
            />
            {phoneError && (
              <p className="error-text" style={{marginTop: '-10px', fontSize: '0.85em'}}>{phoneError}</p>
            )}
        </div>

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={savingSettings}>
            {savingSettings ? "Saving..." : "Save Changes"}
          </button>
          {settingsMessage && <span className="success-message">{settingsMessage}</span>}
        </div>
      </form>
    </div>
  );

  const selectedForm = forms.find((f) => f.id === selectedFormId);

  return (
    <div className="volunteer-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="profile-section">
            <div className="profile-avatar">V</div>
            <h2 className="profile-name">{volunteer ? volunteer.name : 'Volunteer'}</h2>
            <p className="profile-email">{volunteer ? volunteer.email : ''}</p>
            {volunteer?.phone && <p className="profile-phone">{volunteer.phone}</p>}
          </div>

          <div className="stats-grid">
            <div className="sidebar-item">
              <h3>{formsThisMonth}</h3>
              <p>Forms Submitted<br/>This Month</p>
            </div>
            <div className="sidebar-item">
              <h3>{formsToday}</h3>
              <p>Forms Submitted<br/>Today</p>
            </div>
            <div className="sidebar-item" style={{gridColumn: 'span 2'}}>
              <h3>{formsPreviously}</h3>
              <p>Prior Forms<br/>Submitted</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button 
              className={`nav-btn ${activeSection === "forms" ? "active" : ""}`} 
              onClick={() => setActiveSection("forms")}
            >
              Forms
            </button>
            <button 
              className={`nav-btn ${activeSection === "settings" ? "active" : ""}`} 
              onClick={() => setActiveSection("settings")}
            >
              Settings
            </button>
          </nav>
        </div>

        <button className="logout-btn sidebar-item" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {activeSection === "forms" ? (
          <>
            <div className="main-header">
              <div className="tab-buttons">
                <h1>Student Forms</h1>
              </div>
              <button className="btn btn-primary" onClick={handleFillFormClick}>
                + New Form
              </button>
            </div>

            <div className="table-wrapper">
              {loading && (
                <div style={{ padding: 16, color: "#6b7280" }}>
                  Loading forms...
                </div>
              )}

              <table className="forms-table">
                <thead>
                  <tr>
                    <th>Form ID</th>
                    <th>Name</th>
                    <th>Camp Name</th>
                    <th>Submitted Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.map((form) => (
                    <tr
                      key={form.id}
                      className={form.id === selectedFormId ? "selected" : ""}
                    >
                      <td onClick={() => handleFormClick(form.id)}>
                        {form.displayId}
                      </td>
                      <td onClick={() => handleFormClick(form.id)}>
                        {form.title}
                      </td>
                      <td onClick={() => handleFormClick(form.id)}>
                        {form.campName}
                      </td>
                      <td onClick={() => handleFormClick(form.id)}>
                        {form.dateSubmitted}
                      </td>
                      <td>
                        <button
                          className="btn primary btn-small"
                          onClick={() => handleEditClick(form)}
                          style={{fontSize: '0.85rem', padding: '0.5rem 0.75rem'}}
                        >
                          ✎ Edit
                        </button>
                        <button
                          className="btn btn-small"
                          style={{background: '#ef4444', color: 'white', fontSize: '0.85rem', padding: '0.5rem 0.75rem'}}
                          onClick={() => handleDeleteClick(form.id)}
                        >
                          🗑 Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {!loading && forms.length === 0 && (
                <div style={{ padding: 16, textAlign: "center", color: "#6b7280" }}>
                  No submitted forms found for this volunteer.
                </div>
              )}
            </div>

            {selectedForm && (
              <div className="form-details">
                <h2>{selectedForm.title}</h2>
                <p>{selectedForm.details}</p>
              </div>
            )}
          </>
        ) : renderSettings()}
      </main>
    </div>
  );
}
