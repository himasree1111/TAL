import React from "react";

export default function AdminSettings({
  adminName, setAdminName,
  currentUser,
  contactNumber, setContactNumber,
  emailNotifications, setEmailNotifications,
  smsAlerts, setSmsAlerts,
  systemNotifications, setSystemNotifications,
  defaultLanguage, setDefaultLanguage,
  timeZone, setTimeZone,
  handleSaveSettings,
}) {
  return (
    <section className="settings-section">
      <div className="section-header">
        <h3>System Settings</h3>
        <div className="section-actions">
          <button className="btn primary" onClick={handleSaveSettings}>Save Changes</button>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h4>Profile Settings</h4>
          <div className="settings-form">
            <label>
              Admin Name
              <input type="text" className="form-input" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Enter admin name" />
            </label>
            <label>
              Email Address
              <input type="email" className="form-input" value={currentUser?.email || ""} readOnly placeholder="Email cannot be changed" />
            </label>
            <label>
              Contact Number
              <input type="tel" className="form-input" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="Enter contact number" />
            </label>
          </div>
        </div>

        <div className="settings-card">
          <h4>Notification Preferences</h4>
          <h4>(Under Construction)</h4>
          <div className="settings-form">
            <label className="checkbox-label">
              <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} /> Email Notifications
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} /> SMS Alerts
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={systemNotifications} onChange={(e) => setSystemNotifications(e.target.checked)} /> System Notifications
            </label>
          </div>
        </div>

        <div className="settings-card">
          <h4>System Preferences</h4>
          <h4>(Under Construction)</h4>
          <div className="settings-form">
            <label>
              Default Language
              <select className="form-input" value={defaultLanguage} onChange={(e) => setDefaultLanguage(e.target.value)}>
                <option>English</option>
                <option>Hindi</option>
              </select>
            </label>
            <label>
              Time Zone
              <select className="form-input" value={timeZone} onChange={(e) => setTimeZone(e.target.value)}>
                <option>IST (UTC+5:30)</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
