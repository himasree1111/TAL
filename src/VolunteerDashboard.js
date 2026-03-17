import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VolunteerDashboard.css";
import supabase from "./supabaseClient";

export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [activeSection, setActiveSection] = useState("forms");
  const [volunteerName, setVolunteerName] = useState("Volunteer");
  const [volunteerEmail, setVolunteerEmail] = useState("");
  const [volunteerId, setVolunteerId] = useState(null);
  const [settings, setSettings] = useState({ name: "", email: "", phone: "" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVolunteerData = async () => {
      const sessionResult = await supabase.auth.getSession();
      const user = sessionResult?.data?.session?.user;

      if (!user) {
        setLoading(false);
        navigate("/volunteerlogin");
        return;
      }

      const email = user.email || "";
      const name = user.user_metadata?.name || (email ? email.split("@")[0] : "Volunteer");

      setVolunteerId(user.id);
      setVolunteerEmail(email);
      setVolunteerName(name);

      setSettings({
        name,
        email,
        phone: ""
      });

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('full_name,email,phone')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116' && profileError.code !== '42P01') {
          console.warn('VolunteerDashboard: profile fetch error (ignored):', profileError);
        }

        if (!profileError && profileData) {
          setSettings({
            name: profileData.full_name || name,
            email: profileData.email || email,
            phone: profileData.phone || ""
          });
        }
      } catch (err) {
        console.warn('VolunteerDashboard: profile fetch failed, continuing without profile row:', err);
      }

      await fetchForms(email);
    };

    fetchVolunteerData();
  }, [navigate]);

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
    setLoading(false);
  };

  const handleFormClick = (id) => {
    setSelectedFormId(id);
  };

  const handleFillFormClick = () => {
    localStorage.removeItem("editFormData");
    navigate("/studentform");
  };

  const handleSaveSettings = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!volunteerId) return;

    setSavingSettings(true);
    setSettingsMessage("");
    try {
      const updates = {
        id: volunteerId,
        full_name: settings.name,
        email: settings.email,
        phone: settings.phone,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase.from("profiles").upsert(updates);
      if (profileError && profileError.code !== 'PGRST116' && profileError.code !== '42P01') {
        throw profileError;
      }

      try {
        const { error: authError } = await supabase.auth.updateUser({
          data: { name: settings.name },
        });
        if (authError) {
          console.warn("Volunteer settings: auth metadata save error", authError);
        }
      } catch (authErr) {
        console.warn("Volunteer settings: auth update failed (non-blocking)", authErr);
      }

      setVolunteerName(settings.name);
      setSettingsMessage("Settings saved successfully.");
    } catch (err) {
      console.error("Error saving settings:", err);
      setSettingsMessage(`Error saving settings: ${err.message || err}`);
    } finally {
      setSavingSettings(false);
    }
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
    navigate("/");
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
        <div className="form-row">
          <label>Name</label>
          <input
            value={settings.name}
            onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Full name"
          />
        </div>

        <div className="form-row">
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
            onChange={(e) => setSettings((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="Phone number"
            type="tel"
          />
        </div>

        <div className="form-actions">
          <button className="btn primary" type="submit" disabled={savingSettings}>
            {savingSettings ? "Saving..." : "Save Changes"}
          </button>
          {settingsMessage && <span className="success-text">{settingsMessage}</span>}
        </div>
      </form>
    </div>
  );

  const selectedForm = forms.find((f) => f.id === selectedFormId);

  const thisMonthForms = forms.filter(
    (f) => new Date(f.dateSubmitted).getMonth() === new Date().getMonth()
  ).length;

  const lastMonthForms = forms.filter((f) => {
    const formDate = new Date(f.dateSubmitted);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return (
      formDate.getMonth() === lastMonth.getMonth() &&
      formDate.getFullYear() === lastMonth.getFullYear()
    );
  }).length;

  return (
    <div className="volunteer-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
<div className="profile-section">
            <div className="profile-avatar">V</div>
            <h2 className="profile-name">{volunteerName}</h2>
            <p className="profile-email">{volunteerEmail}</p>
          </div>

          <div className="stats-grid">
            <div className="sidebar-item">
              <h3>{thisMonthForms}</h3>
              <p>This Month</p>
            </div>
            <div className="sidebar-item">
              <h3>{lastMonthForms}</h3>
              <p>Last Month</p>
            </div>
            <div className="sidebar-item" style={{gridColumn: 'span 2'}}>
              <h3>{forms.length}</h3>
              <p>Total Forms</p>
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
              <button className="btn primary fill-form-btn" onClick={handleFillFormClick}>
                New Form
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
                          className="btn primary small icon"
                          onClick={() => handleEditClick(form)}
                        >
                          ✎
                        </button>
                        <button
                          className="btn danger small icon"
                          onClick={() => handleDeleteClick(form.id)}
                        >
                          🗑
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
