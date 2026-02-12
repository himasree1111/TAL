import React, { useState, useEffect } from "react";
import "./studentdashboard.css";
import { useNavigate } from "react-router-dom";
import supabase from "./supabaseClient";

const StudentDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [feePayments, setFeePayments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [donorInfo, setDonorInfo] = useState(null);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user session
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) {
          navigate("/student-login");
          return;
        }

        setUserName(user.user_metadata?.name || user.email);
        setUserEmail(user.email);

        // Fetch student's form submission by email
        const { data: submissions } = await supabase
          .from("student_form_submissions")
          .select("*")
          .eq("email", user.email);

        if (submissions && submissions.length > 0) {
          const submission = submissions[0];
          setStudent(submission);

          // Fetch fee payments for this student
          const { data: fees } = await supabase
            .from("fee_payments")
            .select("*")
            .eq("student_id", submission.id);
          if (fees) setFeePayments(fees);

          // Fetch donor mapping for this student (current sponsor)
          const { data: mappings } = await supabase
            .from("donor_mapping")
            .select("*")
            .eq("student_id", submission.id);
          if (mappings) {
            const currentDonor = mappings.find((m) => m.is_current_sponsor);
            if (currentDonor) setDonorInfo(currentDonor);
          }

          // Build documents list from uploaded file URLs (legacy)
          const docs = [];
          if (submission.school_id_url) docs.push({ id: "school_id", name: "School ID", type: "id", url: submission.school_id_url });
          if (submission.aadhaar_url) docs.push({ id: "aadhaar", name: "Aadhaar Card", type: "id", url: submission.aadhaar_url });
          if (submission.income_proof_url) docs.push({ id: "income", name: "Income Proof", type: "certificate", url: submission.income_proof_url });
          if (submission.marksheet_url) docs.push({ id: "marksheet", name: "Marksheet", type: "certificate", url: submission.marksheet_url });
          if (submission.passport_photo_url) docs.push({ id: "photo", name: "Passport Photo", type: "photo", url: submission.passport_photo_url });
          if (submission.fees_receipt_url) docs.push({ id: "fee_receipt", name: "Fee Receipt", type: "receipt", url: submission.fees_receipt_url });

          // Fetch documents from documents table
          try {
            const axios = (await import("axios")).default;
            const { data: docsResp } = await axios.get(`/api/documents?student_id=${submission.id}`);
            if (docsResp?.data) {
              docsResp.data.forEach(d => {
                docs.push({ id: d.id, name: d.file_name, type: d.category || "document", url: d.file_url, dbRecord: true });
              });
            }
          } catch (e) { console.error("Documents fetch error:", e); }
          setDocuments(docs);
        }

        // Fetch notifications for this student
        const { data: notifs } = await supabase
          .from("notifications")
          .select("*")
          .eq("recipient_email", user.email);
        if (notifs) setAlerts(notifs);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleMarkRead = async (alertId) => {
    try {
      const { data: updated } = await supabase
        .from("notifications")
        .update({ is_read: 1 })
        .eq("id", alertId);
      if (updated) {
        setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, is_read: 1 } : a)));
      }
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file || !student) return;
    try {
      const axios = (await import("axios")).default;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("student_id", student.id);
      formData.append("uploaded_by", userEmail);
      formData.append("category", "student_upload");
      const { data: resp } = await axios.post("/api/documents", formData);
      if (resp?.error) {
        alert("Upload error: " + resp.error.message);
        return;
      }
      const d = resp.data;
      setDocuments((prev) => [...prev, { id: d.id, name: d.file_name, type: d.category || "document", url: d.file_url, dbRecord: true }]);
      alert("Document uploaded successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed.");
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Delete this document?")) return;
    try {
      const axios = (await import("axios")).default;
      await axios.delete(`/api/documents/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      alert("Error deleting document.");
    }
  };

  const handleSendFeeAlert = async () => {
    if (!student) return;
    const studentName = `${student.first_name || ""} ${student.last_name || ""}`.trim();
    const message = `${studentName} (ID: ${student.id}) has a pending fee of \u20B9${dueAmount.toLocaleString()}. Please follow up.`;
    try {
      await supabase.from("notifications").insert({
        title: "Fee Alert from Student",
        message,
        type: "fee",
        priority: "high",
        recipient_email: student.volunteer_email,
      });
      alert("Fee alert sent to your volunteer successfully!");
    } catch (err) {
      console.error("Error sending fee alert:", err);
      alert("Failed to send fee alert.");
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#e74c3c";
      case "medium":
        return "#f39c12";
      case "low":
        return "#27ae60";
      default:
        return "#ccc";
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "workshop":
        return String.fromCodePoint(0x1F4DA);
      case "deadline":
        return String.fromCodePoint(0x23F0);
      case "fee":
        return String.fromCodePoint(0x1F4B0);
      case "event":
        return String.fromCodePoint(0x1F3AF);
      case "broadcast":
        return String.fromCodePoint(0x1F4E2);
      default:
        return String.fromCodePoint(0x1F514);
    }
  };

  // Calculate fee status from real payments
  const totalFee = student ? parseFloat(student.fee_structure) || 0 : 0;
  const totalPaid = feePayments.reduce((sum, fp) => sum + (parseFloat(fp.amount) || 0), 0);
  const dueAmount = Math.max(0, totalFee - totalPaid);
  const displayStatus =
    totalFee === 0
      ? "N/A"
      : dueAmount === 0
      ? "Paid"
      : totalPaid === 0
      ? "Not Paid"
      : "Partially Paid";

  if (loading) return <div className="student-container"><p style={{ padding: "2rem", textAlign: "center" }}>Loading...</p></div>;

  return (
    <div className="student-container">
      {/* Header */}
      <header className="student-header">
        <div className="header-content">
          <h1>Student Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {student ? `${student.first_name || ""} ${student.last_name || ""}`.trim() : userName}!</span>
            <div className="student-id">{student ? `ID: ${student.id}` : userEmail}</div>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className="sidebar">
          {student ? (
            <>
              <div className="sidebar-card">
                <h3>Student Profile</h3>
                <p>
                  <strong>Program:</strong> {student.educationcategory || "N/A"}
                </p>
                <p>
                  <strong>Year:</strong> {student.educationyear || "N/A"}
                </p>
                <p>
                  <strong>School:</strong> {student.school || "N/A"}
                </p>
                <p>
                  <strong>Branch:</strong> {student.branch || "N/A"}
                </p>
                <p>
                  <strong>Email:</strong> {student.email || userEmail}
                </p>
              </div>

              <div className="sidebar-card">
                <h3>Academic Performance</h3>
                <div className="stats">
                  <div>
                    <h2>{student.present_percent ? `${student.present_percent}%` : "N/A"}</h2>
                    <span>Current %</span>
                  </div>
                  <div>
                    <h2>{student.prev_percent ? `${student.prev_percent}%` : "N/A"}</h2>
                    <span>Previous %</span>
                  </div>
                </div>
              </div>

              <div className="sidebar-card">
                <h3>Fee Status</h3>
                <p>Total Fee: {"\u20B9"}{totalFee.toLocaleString()}</p>
                <p>Paid: {"\u20B9"}{totalPaid.toLocaleString()}</p>
                <p>Due: {"\u20B9"}{dueAmount.toLocaleString()}</p>
                {feePayments.length > 0 && (
                  <p>Last Payment: {feePayments[0].payment_date}</p>
                )}
                <span
                  className={`status ${displayStatus.toLowerCase().replace(" ", "_")}`}
                >
                  {displayStatus}
                </span>
                {dueAmount > 0 && student.volunteer_email && (
                  <button
                    className="btn blue"
                    style={{ marginTop: "0.75rem", width: "100%" }}
                    onClick={handleSendFeeAlert}
                  >
                    Send Fee Alert
                  </button>
                )}
              </div>

              {/* Know Your Volunteer */}
              {student.volunteer_name && (
                <div className="sidebar-card">
                  <h3>Your Volunteer</h3>
                  <p><strong>Name:</strong> {student.volunteer_name}</p>
                  {student.volunteer_email && (
                    <p><strong>Email:</strong> {student.volunteer_email}</p>
                  )}
                  {student.volunteer_contact && (
                    <p><strong>Contact:</strong> {student.volunteer_contact}</p>
                  )}
                </div>
              )}

              {/* Know Your Donor */}
              {donorInfo && (
                <div className="sidebar-card">
                  <h3>Your Donor</h3>
                  <p><strong>Name:</strong> {donorInfo.donor_name}</p>
                  {donorInfo.year_of_support && (
                    <p><strong>Supporting Since:</strong> {donorInfo.year_of_support}</p>
                  )}
                  {donorInfo.amount > 0 && (
                    <p><strong>Sponsorship:</strong> {"\u20B9"}{parseFloat(donorInfo.amount).toLocaleString()}</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="sidebar-card">
              <h3>No Submission Found</h3>
              <p>You haven't submitted a student form yet.</p>
              <button
                className="btn blue"
                onClick={() => navigate("/studentform")}
                style={{ marginTop: "1rem" }}
              >
                Submit Form
              </button>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="main-section">
          <section className="alerts-section">
            <div className="section-header">
              <h2>Alerts & Reminders</h2>
              <span className="alert-count">
                {alerts.filter((a) => !a.is_read).length} unread
              </span>
            </div>
            {alerts.length === 0 ? (
              <p style={{ color: "#888", padding: "1rem" }}>No notifications yet.</p>
            ) : (
              <div className="alert-grid">
                {alerts.map((a) => (
                  <div
                    key={a.id}
                    className="alert-card"
                    style={{ opacity: a.is_read ? 0.6 : 1 }}
                    onClick={() => !a.is_read && handleMarkRead(a.id)}
                    title={a.is_read ? "Read" : "Click to mark as read"}
                  >
                    <div className="alert-header">
                      <span className="alert-icon">{getAlertIcon(a.type)}</span>
                      <span
                        className="alert-dot"
                        style={{ backgroundColor: getPriorityColor(a.priority) }}
                      ></span>
                    </div>
                    <h4>{a.title}</h4>
                    <p>{a.message || a.created_at?.split("T")[0] || ""}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="documents-section">
            <div className="section-header">
              <h2>My Documents</h2>
              <label htmlFor="fileUpload" className="upload-btn">
                {String.fromCodePoint(0x1F4C1)} Upload
              </label>
              <input id="fileUpload" type="file" onChange={handleFileUpload} />
            </div>

            {documents.length === 0 ? (
              <p style={{ color: "#888", padding: "1rem" }}>No documents uploaded yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Document Name</th>
                    <th>Type</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td>{doc.name}</td>
                      <td>{doc.type}</td>
                      <td>
                        {doc.url ? (
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn blue"
                          >
                            View
                          </a>
                        ) : (
                          <span style={{ color: "#888" }}>Uploaded</span>
                        )}
                        {doc.dbRecord && (
                          <button
                            className="btn"
                            style={{ marginLeft: "8px", color: "#e74c3c", fontSize: "0.85em" }}
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;
