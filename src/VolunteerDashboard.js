import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useVolunteer } from "./VolunteerContext";
import "./VolunteerDashboard.css";
import supabase from "./supabaseClient";
import {
  getVolunteerNotifications,
  subscribeToNotifications,
  filterNotification,
} from "./notificationService";


export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const { volunteer, loading: contextLoading, updateVolunteerData } = useVolunteer();
  const [forms, setForms] = useState([]);
  const [formsThisMonth, setFormsThisMonth] = useState(0);
  const [formsToday, setFormsToday] = useState(0);
  const [formsPreviously, setFormsPreviously] = useState(0);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [activeSection, setActiveSection] = useState("forms");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settings, setSettings] = useState({ name: "", email: "", phone: "" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(true);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Fetch volunteer notifications on mount 
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoadingNotifications(true);
      const result = await getVolunteerNotifications(volunteer?.email);
      if (result.success) {
        setNotifications(result.notifications);
      }
      setLoadingNotifications(false);
    };

    fetchNotifications();

    // Real-time subscription — volunteer or all audience
    const subscription = subscribeToNotifications((newData) => {
      if (!newData.expires_at || new Date(newData.expires_at) > new Date()) {
        setNotifications((prev) => {
          const exists = prev.some((n) => n.id === newData.id);
          if (exists) return prev;
          return [newData, ...prev];
        });
      }
    });

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [volunteer?.email]); 

  const totalNotifications = notifications.length;


const formatToIST = (dateString) => {
  if (!dateString) return new Date();
  const utcDate = new Date(dateString);
  const istOffsetMs = 5.5 * 60 * 60 * 1000; // IST UTC+5:30
  return new Date(utcDate.getTime() + istOffsetMs);
};

const formatRelative = (dateStr) => {
  if (!dateStr) return "";
  const istDate = formatToIST(dateStr);
  const diffMs = Date.now() - istDate.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 5) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};


  const isImportantNotification = (item) => {
    const title = item.title?.toLowerCase() || "";
    const message = item.message?.toLowerCase() || "";
    return title.includes("urgent") || title.includes("important") || message.includes("urgent") || message.includes("important");
  };



  const renderNotifications = () => {
    if (loadingNotifications) {
      return <div className="empty-state">Loading notifications...</div>;
    }
    if (!notifications.length) {
      return <div className="empty-state">No notifications available.</div>;
    }

    const sortedNotifications = [...notifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return (
      <div className="notification-grid">
        {sortedNotifications.map((item) => {
          const isImportant = isImportantNotification(item);
          return (
            <article
              key={item.id}
              className={`notification-card ${isImportant ? "important" : ""}`}
            >
              <div className="notification-title">
                <strong>{item.title || "Untitled"}</strong>
                <div className="notification-tags">
                  {isImportant && <span className="badge important">Important</span>}
                </div>
              </div>
              <p className="notification-message">{item.message}</p>
              <div className="notification-meta">
                <span className="timestamp">{formatRelative(item.created_at)}</span>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  // Fetch stats directly from Supabase counts for accuracy
  useEffect(() => {
    const fetchCounts = async () => {
      if (!volunteer?.email) return;

      const now = new Date();
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      try {
        // Today count
        const { count: todayCount } = await supabase
          .from("student_form_submissions")
          .select("*", { count: "exact", head: true })
          .eq("volunteer_email", volunteer.email)
          .gte("created_at", startOfToday.toISOString());

        // Month count
        const { count: monthCount } = await supabase
          .from("student_form_submissions")
          .select("*", { count: "exact", head: true })
          .eq("volunteer_email", volunteer.email)
          .gte("created_at", startOfMonth.toISOString());

        // Total count
        const { count: totalCount } = await supabase
          .from("student_form_submissions")
          .select("*", { count: "exact", head: true })
          .eq("volunteer_email", volunteer.email);

        const previouslyCount = (totalCount || 0) - (monthCount || 0);

        setFormsToday(todayCount || 0);
        setFormsThisMonth(monthCount || 0);
        setFormsPreviously(previouslyCount);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchCounts();

    // Refresh every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [volunteer?.email]);

  useEffect(() => {
    if (!volunteer || contextLoading) {
      if (!contextLoading && !volunteer) {
        navigate("/coverpage");
      }
      return;
    }

    // Sync settings with context
    setSettings({
      name: volunteer.name,
      email: volunteer.email,
      phone: volunteer.phone
    });

    // Fetch forms
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

    // Refresh forms and stats
    if (volunteer?.email) {
      fetchForms(volunteer.email);
    }
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
          <button className="btn primary" type="submit" disabled={savingSettings}>
            {savingSettings ? "Saving..." : "Save Changes"}
          </button>
          {settingsMessage && <span className="success-text">{settingsMessage}</span>}
        </div>
      </form>
    </div>
  );

  const selectedForm = forms.find((f) => f.id === selectedFormId);

  return (
    <div className="volunteer-dashboard">
      {sidebarOpen && (
        <div
          className="volunteer-sidebar-overlay active"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
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
              <p>Forms filled in this month</p>
            </div>
            <div className="sidebar-item">
              <h3>{formsToday}</h3>
              <p>Forms filled today</p>
            </div>
            <div className="sidebar-item" style={{gridColumn: 'span 2'}}>
              <h3>{formsPreviously}</h3>
              <p>Forms filled previously</p>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button 
              className={`nav-btn ${activeSection === "forms" ? "active" : ""}`} 
              onClick={() => {
                setActiveSection("forms");
                setSidebarOpen(false);
              }}
            >
              Forms
            </button>
            <button 
              className={`nav-btn ${activeSection === "notifications" ? "active" : ""}`} 
              onClick={() => {
                setActiveSection("notifications");
                setSidebarOpen(false);
              }}
              style={{ position: 'relative' }}
            >
              Notifications 🔔
            </button>

{/* 
              <button 
              className={`nav-btn ${activeSection === "settings" ? "active" : ""}`} 
              onClick={() => {
                setActiveSection("settings");
                setSidebarOpen(false);
              }}
            >
              Settings
            </button> 
            COMMENETED OUT PER REQUEST
          */}
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
              <button
                className="volunteer-menu-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar menu"
              >
                ☰
              </button>
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
        ) : activeSection === "notifications" ? (
          <>
            <div className="main-header">
              <button
                className="volunteer-menu-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar menu"
              >
                ☰
              </button>
              <div className="tab-buttons">
                <h1>Notifications</h1>
              </div>
            </div>
            <div className="section-header">
              <p className="section-note">Stay updated with announcements from the admin.</p>
            </div>
            {renderNotifications()}
          </>
        ) : renderSettings()}
      </main>
    </div>
  );
}
