import React, { useState } from "react";
import "./studentdashboard.css";

const StudentDashboard = () => {
  const [student] = useState({
    name: "Katie Johnson",
    studentId: "STU2024001",
    email: "katie.johnson@student.edu",
    program: "Computer Science",
    semester: "4th",
    enrollmentDate: "2023-09-01",
  });

  const [academicData] = useState({
    cgpa: 3.75,
    attendance: 92.5,
    completedCredits: 78,
    totalCredits: 120,
  });

  const [feeStatus] = useState({
    totalFee: 5000,
    paidByTAL: 3500,
    paidByStudent: 0,
    dueDate: "2025-11-15",
  });

  const [documents, setDocuments] = useState([
    { id: 1, name: "Semester 3 Marksheet", type: "certificate", uploadedDate: "2024-06-15" },
    { id: 2, name: "Fee Receipt - Oct 2024", type: "receipt", uploadedDate: "2024-10-05" },
    { id: 3, name: "Identity Card", type: "id", uploadedDate: "2023-09-10" },
  ]);

  const [alerts] = useState([
    { id: 1, type: "workshop", title: "Web Development Workshop", date: "2025-10-20", priority: "high" },
    { id: 2, type: "deadline", title: "Document Submission Deadline", date: "2025-10-25", priority: "high" },
    { id: 3, type: "fee", title: "Fee Payment Reminder", date: "2025-11-10", priority: "medium" },
    { id: 4, type: "event", title: "Career Guidance Session", date: "2025-10-30", priority: "low" },
  ]);

  const handleFileUpload = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const newDoc = {
      id: documents.length + 1,
      name: file.name,
      type: "certificate",
      uploadedDate: new Date().toISOString().split("T")[0],
    };
    setDocuments((prev) => [...prev, newDoc]);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high": return "#e74c3c";
      case "medium": return "#f39c12";
      case "low": return "#27ae60";
      default: return "#ccc";
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case "workshop": return "📚";
      case "deadline": return "⏰";
      case "fee": return "💰";
      case "event": return "🎯";
      default: return "🔔";
    }
  };

  const paidByTAL = feeStatus.paidByTAL || 0;
  const paidByStudent = feeStatus.paidByStudent || 0;
  const dueAmount = Math.max(0, feeStatus.totalFee - paidByTAL - paidByStudent);
  const displayStatus =
    dueAmount === 0 ? "Paid" : paidByTAL + paidByStudent === 0 ? "Not Paid" : "Partially Paid";

  return (
    <div className="student-container">
      {/* Header */}
      <header className="student-header">
        <div className="header-content">
          <h1>Student Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {student.name}!</span>
            <div className="student-id">{student.studentId}</div>
          </div>
        </div>
      </header>

      <div className="dashboard-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-card">
            <h3>Student Profile</h3>
            <p><strong>Program:</strong> {student.program}</p>
            <p><strong>Semester:</strong> {student.semester}</p>
            <p><strong>Enrollment:</strong> {student.enrollmentDate}</p>
            <p><strong>Email:</strong> {student.email}</p>
          </div>

          <div className="sidebar-card">
            <h3>Academic Performance</h3>
            <div className="stats">
              <div><h2>{academicData.cgpa}</h2><span>CGPA</span></div>
              <div><h2>{academicData.attendance}%</h2><span>Attendance</span></div>
              <div><h2>{academicData.completedCredits}/{academicData.totalCredits}</h2><span>Credits</span></div>
            </div>
          </div>

          <div className="sidebar-card">
            <h3>Fee Status</h3>
            <p>Total Fee: ₹{feeStatus.totalFee}</p>
            <p>Paid (TAL): ₹{paidByTAL}</p>
            <p>Paid (Student): ₹{paidByStudent}</p>
            <p>Due: ₹{dueAmount}</p>
            <p>Due Date: {feeStatus.dueDate}</p>
            <span className={`status ${displayStatus.toLowerCase().replace(" ", "_")}`}>
              {displayStatus}
            </span>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-section">
          <section className="alerts-section">
            <div className="section-header">
              <h2>Alerts & Reminders</h2>
              <span className="alert-count">{alerts.length} alerts</span>
            </div>
            <div className="alert-grid">
              {alerts.map((a) => (
                <div key={a.id} className="alert-card">
                  <div className="alert-header">
                    <span className="alert-icon">{getAlertIcon(a.type)}</span>
                    <span
                      className="alert-dot"
                      style={{ backgroundColor: getPriorityColor(a.priority) }}
                    ></span>
                  </div>
                  <h4>{a.title}</h4>
                  <p>{a.date}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="documents-section">
            <div className="section-header">
              <h2>My Documents</h2>
              <label htmlFor="fileUpload" className="upload-btn">
                📁 Upload
              </label>
              <input id="fileUpload" type="file" onChange={handleFileUpload} />
            </div>

            <table>
              <thead>
                <tr>
                  <th>Document Name</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.name}</td>
                    <td>{doc.type}</td>
                    <td>{doc.uploadedDate}</td>
                    <td>
                      <button className="btn blue">Download</button>
                      <button className="btn red">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </main>
      </div>
    </div>
  );
};

export default StudentDashboard;