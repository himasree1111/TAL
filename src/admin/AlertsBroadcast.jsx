import React from "react";

export default function AlertsBroadcast({
  broadcastTitle, setBroadcastTitle,
  broadcastMessage, setBroadcastMessage,
  broadcastRecipient, setBroadcastRecipient,
  adminNotifications, handleSendBroadcast, handleDeleteNotification,
}) {
  return (
    <section className="broadcast-section">
      <div className="section-header">
        <h3>Alerts & Broadcasts</h3>
      </div>

      <div style={{ background: "#f9f9f9", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
        <h4 style={{ marginBottom: "12px" }}>Send New Notification</h4>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "500px" }}>
          <label style={{ fontSize: "0.85em" }}>
            Title *
            <input className="form-input" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} placeholder="Notification title" />
          </label>
          <label style={{ fontSize: "0.85em" }}>
            Message
            <textarea className="form-input" rows={3} value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} placeholder="Message body" />
          </label>
          <label style={{ fontSize: "0.85em" }}>
            Recipients
            <select className="form-input" value={broadcastRecipient} onChange={(e) => setBroadcastRecipient(e.target.value)}>
              <option value="all">All Users</option>
              <option value="student">All Students</option>
              <option value="donor">All Donors</option>
              <option value="volunteer">All Volunteers</option>
            </select>
          </label>
          <button className="btn primary" style={{ alignSelf: "flex-start" }} onClick={handleSendBroadcast}>Send Broadcast</button>
        </div>
      </div>

      <div className="broadcast-types">
        <div className="broadcast-card">
          <h4>Fee Reminders</h4>
          <p>Send automated reminders for fee payments</p>
          <button className="btn" onClick={() => { setBroadcastTitle("Fee Payment Reminder"); setBroadcastMessage("This is a reminder to submit your pending fee payments."); setBroadcastRecipient("student"); }}>Use Template</button>
        </div>
        <div className="broadcast-card">
          <h4>Event Announcements</h4>
          <p>Broadcast upcoming events and activities</p>
          <button className="btn" onClick={() => { setBroadcastTitle("Upcoming Event"); setBroadcastMessage(""); setBroadcastRecipient("all"); }}>Use Template</button>
        </div>
        <div className="broadcast-card">
          <h4>Document Requests</h4>
          <p>Request necessary documents from students</p>
          <button className="btn" onClick={() => { setBroadcastTitle("Document Submission Required"); setBroadcastMessage("Please submit the required documents at your earliest convenience."); setBroadcastRecipient("student"); }}>Use Template</button>
        </div>
      </div>

      <div className="broadcast-history">
        <h4>Recent Notifications ({adminNotifications.length})</h4>
        <div className="table-wrap">
          <table className="data-table" aria-label="Fee payment summary">
            <thead>
              <tr>
                <th>Date</th>
                <th>Title</th>
                <th>Message</th>
                <th>Recipient</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminNotifications.slice(0, 20).map((n) => (
                <tr key={n.id}>
                  <td>{n.created_at ? new Date(n.created_at).toLocaleDateString() : "-"}</td>
                  <td>{n.title}</td>
                  <td>{n.message || "-"}</td>
                  <td>{n.recipient_email || n.recipient_role || "All"}</td>
                  <td>{n.type}</td>
                  <td>
                    <button className="btn small" style={{ color: "#c62828" }} onClick={() => handleDeleteNotification(n.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {adminNotifications.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: "center", color: "#888" }}>No notifications sent yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
