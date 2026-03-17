import React, { useEffect, useMemo, useState } from "react";
import "./studentdashboard.css";
import { useNavigate } from "react-router-dom";
import supabase from "./supabaseClient";
import {
  getStudentNotifications,
  markNotificationAsRead,
  subscribeToNotifications,
} from "./notificationService";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard Overview", icon: "🏠" },
  { key: "notifications", label: "Alerts & Broadcasts", icon: "🔔" },
  { key: "documents", label: "Document Upload", icon: "📄" },
  { key: "settings", label: "Student Settings", icon: "⚙️" },
];

const DOCUMENT_CATEGORIES = [
  { key: "semester", title: "Semester Documents", icon: "📚" },
  { key: "fee", title: "Fee Receipts", icon: "💰" },
  { key: "certificates", title: "Certificates", icon: "🎓" },
];

const initialDocumentState = DOCUMENT_CATEGORIES.reduce((acc, curr) => {
  acc[curr.key] = [];
  return acc;
}, {});

const formatRelative = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 5) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const isImportantNotification = (item) => {
  const title = item.notifications?.title?.toLowerCase() || "";
  const message = item.notifications?.message?.toLowerCase() || "";
  return title.includes("urgent") || title.includes("important") || message.includes("urgent") || message.includes("important");
};

const StatCard = ({ icon, label, value }) => (
  <div className="stat-card">
    <div className="stat-icon" aria-hidden="true">
      {icon}
    </div>
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  </div>
);

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [notifFilter, setNotifFilter] = useState("all");
  const [documents, setDocuments] = useState(initialDocumentState);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState("");
  const [settings, setSettings] = useState({ name: "", email: "", phone: "" });
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);


  useEffect(() => {
    const init = async () => {
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !currentUser) {
        navigate("/student-login");
        return;
      }

      setUser(currentUser);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, email, student_id, phone, program, semester, enrollment_date")
        .eq("id", currentUser.id)
        .single();

      const fullName = profileData?.full_name || currentUser.user_metadata?.full_name || "Student";
      const email = profileData?.email || currentUser.email || "";

      setProfile({
        name: fullName,
        email,
        studentId: profileData?.student_id || "",
        program: profileData?.program || "",
        semester: profileData?.semester || "",
        enrollmentDate: profileData?.enrollment_date || "",
      });

      setSettings({ name: fullName, email, phone: profileData?.phone || "" });

      await loadNotifications(currentUser.id);

      const subscription = subscribeToNotifications(currentUser.id, (payload) => {
        if (payload?.new?.id) {
          loadNotifications(currentUser.id);
        }
      });

      return () => {
        subscription?.unsubscribe?.();
      };
    };

    init();
  }, [navigate]);

  const loadNotifications = async (studentId) => {
    const { success, notifications: incoming, error: notifError } =
      await getStudentNotifications(studentId);

    if (!success) {
      setError(notifError || "Unable to load notifications");
      return;
    }

    setNotifications((prev) => {
      const seen = new Set(prev.map((n) => n.id));
      const deduped = incoming.filter((n) => !seen.has(n.id));
      return [...deduped, ...prev].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleMarkRead = async (notif) => {
    if (notif.is_read) return;
    await markNotificationAsRead(notif.id);
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notif.id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item
      )
    );
  };

  const handleUpload = async (category, files) => {
    setError("");

    const tasks = Array.from(files).map(async (file) => {
      const id = `${category}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setUploadProgress((prev) => ({ ...prev, [id]: { progress: 0, name: file.name } }));

      const folder = `student_docs/${user?.id}/${category}`;
      const fileName = `${Date.now()}_${file.name}`.replace(/\s+/g, "_");
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("student_documents")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        setError("Upload failed. Please try again.");
        setUploadProgress((prev) => ({ ...prev, [id]: { ...prev[id], progress: 0, error: true } }));
        return null;
      }

      const { data: publicData } = supabase.storage
        .from("student_documents")
        .getPublicUrl(filePath);

      const docEntry = {
        id,
        name: file.name,
        category,
        uploadedAt: new Date().toISOString(),
        url: publicData?.publicUrl || null,
        status: "pending",
      };

      setDocuments((prev) => ({
        ...prev,
        [category]: [docEntry, ...(prev[category] || [])],
      }));

      setUploadProgress((prev) => ({ ...prev, [id]: { ...prev[id], progress: 100 } }));
      return docEntry;
    });

    await Promise.all(tasks);
  };

  const handleRemoveDocument = (category, id) => {
    setDocuments((prev) => ({
      ...prev,
      [category]: prev[category].filter((doc) => doc.id !== id),
    }));
  };

  const handleSettingsChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setError("");
    setSaveSuccess(false);

    try {
      const updates = {
        id: user?.id,
        full_name: settings.name,
        email: settings.email,
        phone: settings.phone,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase.from("profiles").upsert(updates);
      if (updateError) throw updateError;

      setSaveSuccess(true);
      setProfile((prev) => ({ ...prev, name: settings.name, email: settings.email }));
    } catch (err) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  const totalDocuments = useMemo(() => Object.values(documents).flat().length, [documents]);

  const totalNotifications = notifications.length;

  const filteredNotifications = useMemo(() => {
    const list = [...notifications].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    if (notifFilter === "unread") {
      return list.filter((item) => !item.is_read);
    }

    if (notifFilter === "important") {
      return list.filter(isImportantNotification);
    }

    return list;
  }, [notifications, notifFilter]);

  const renderSidebar = () => (
    <aside className="student-sidebar">
      <div className="profile-card">
        <div className="avatar" aria-hidden="true">
          {profile.name ? profile.name.charAt(0).toUpperCase() : "S"}
        </div>
        <div className="profile-meta">
          <h3>{profile.name || "Student"}</h3>
          {profile.studentId && <p className="subtle">ID: {profile.studentId}</p>}
          {profile.email && <p className="subtle">{profile.email}</p>}
        </div>
      </div>

      <nav className="nav-menu">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${activeNav === item.key ? "active" : ""}`}
            onClick={() => setActiveNav(item.key)}
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );

  const renderStatsBar = () => (
    <div className="stats-bar">
      <StatCard icon="📄" label="Total Documents" value={totalDocuments} />
      <StatCard icon="🔔" label="Notifications" value={totalNotifications} />
    </div>
  );

  const renderNotificationFilters = () => (
    <div className="filter-bar">
      {[
        { key: "all", label: "All" },
        { key: "unread", label: "Unread" },
        { key: "important", label: "Important" },
      ].map((option) => (
        <button
          key={option.key}
          className={`filter-button ${notifFilter === option.key ? "active" : ""}`}
          onClick={() => setNotifFilter(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  const renderNotifications = () => {
    if (!filteredNotifications.length) {
      return <div className="empty-state">No notifications match this filter.</div>;
    }

    return (
      <div className="notification-grid">
        {filteredNotifications.map((item) => {
          const isNew = !item.is_read;
          const isImportant = isImportantNotification(item);

          return (
            <article
              key={item.id}
              className={`notification-card ${isNew ? "new" : "read"} ${
                isImportant ? "important" : ""
              }`}
              onClick={() => handleMarkRead(item)}
            >
              <div className="notification-title">
                <strong>{item.notifications?.title || "Untitled"}</strong>
                <div className="notification-tags">
                  {isNew && <span className="badge">New</span>}
                  {isImportant && <span className="badge important">Important</span>}
                </div>
              </div>
              <p className="notification-message">{item.notifications?.message}</p>
              <div className="notification-meta">
                <span className="timestamp">{formatRelative(item.notifications?.created_at)}</span>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  const renderDocumentUpload = () => (
    <div className="documents-grid">
      {DOCUMENT_CATEGORIES.map((category) => {
        const docs = documents[category.key] || [];
        return (
          <section key={category.key} className="doc-card">
            <div className="doc-card-header">
              <div>
                <div className="doc-tag">{category.icon}</div>
                <h3>{category.title}</h3>
                <p className="doc-subtitle">Upload, preview and manage your files.</p>
              </div>
              <label className="upload-action">
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      handleUpload(category.key, e.target.files);
                      e.target.value = null;
                    }
                  }}
                />
                <span className="upload-btn">Upload</span>
              </label>
            </div>

            {!docs.length && <div className="empty-state">No files uploaded yet.</div>}

            {docs.map((doc) => (
              <div key={doc.id} className="doc-row">
                <div className="doc-meta">
                  <div className="doc-name">{doc.name}</div>
                  <div className="doc-subtle">
                    {doc.status === "approved" ? "Verified" : "Pending"} •{' '}
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="doc-actions">
                  {doc.url ? (
                    <a className="link" href={doc.url} target="_blank" rel="noreferrer">
                      View
                    </a>
                  ) : (
                    <span className="subtle">Processing…</span>
                  )}
                  <button
                    className="icon-btn"
                    onClick={() => handleRemoveDocument(category.key, doc.id)}
                    aria-label="Remove file"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {Object.entries(uploadProgress)
              .filter(([key]) => key.startsWith(category.key))
              .map(([key, progress]) => (
                <div key={key} className="upload-progress">
                  <div className="upload-meta">
                    <span>{progress.name}</span>
                    {progress.error ? (
                      <span className="upload-error">Failed</span>
                    ) : (
                      <span className="upload-percent">{progress.progress}%</span>
                    )}
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>
              ))}
          </section>
        );
      })}
    </div>
  );

  const renderSettings = () => (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>Student Settings</h2>
        <p className="section-note">Update your profile and change your password.</p>
      </div>

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
            onChange={(e) => handleSettingsChange("name", e.target.value)}
            placeholder="Full name"
          />
        </div>

        <div className="form-row">
          <label>Email</label>
          <input
            value={settings.email}
            onChange={(e) => handleSettingsChange("email", e.target.value)}
            placeholder="Email address"
          />
        </div>

        <div className="form-row">
          <label>Phone</label>
          <input
            value={settings.phone}
            onChange={(e) => handleSettingsChange("phone", e.target.value)}
            placeholder="Phone number"
          />
        </div>

        <div className="form-actions">
          <button className="btn primary" type="submit" disabled={savingSettings}>
            {savingSettings ? "Saving…" : "Save Changes"}
          </button>
          {saveSuccess && <span className="success-text">Saved successfully.</span>}
        </div>
      </form>
    </div>
  );

  const renderOverview = () => (
    <>
      <div className="section-header">
        <div>
          <h2>Dashboard Overview</h2>
          <p className="section-note">Quick summary of your documents and recent alerts.</p>
        </div>
      </div>

      {renderStatsBar()}

      <div className="section-block">
        <div className="section-header">
          <h3>Recent Alerts</h3>
          <p className="section-note">Tap to mark as read and keep up to date.</p>
        </div>
        {renderNotificationFilters()}
        {renderNotifications()}
      </div>

      <div className="section-block">
        <div className="section-header">
          <h3>Recent Documents</h3>
          <p className="section-note">Latest uploads and their verification status.</p>
        </div>
        {renderDocumentUpload()}
      </div>
    </>
  );

  const renderMainContent = () => {
    if (activeNav === "documents") {
      return (
        <>
          <div className="section-header">
            <h2>Upload Documents</h2>
            <span className="section-note">Keep your documents up to date for verification.</span>
          </div>
          {renderDocumentUpload()}
        </>
      );
    }

    if (activeNav === "notifications") {
      return (
        <>
          <div className="section-header">
            <h2>Alerts & Reminders</h2>
            <span className="section-note">Tap a notification to mark it as read.</span>
          </div>
          {renderNotificationFilters()}
          {renderNotifications()}
        </>
      );
    }

    if (activeNav === "settings") {
      return renderSettings();
    }

    return renderOverview();
  };

  return (
    <div className="student-root">
      {renderSidebar()}
      <main className="student-main">
        <header className="student-main-header">
          <div>
            <h1>Welcome back, {profile.name || "Scholar"}</h1>
            <p className="subtle">Your dashboard for managing scholarship documents and alerts.</p>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <section className="content-area">{renderMainContent()}</section>
      </main>
    </div>
  );
};

export default StudentDashboard;

