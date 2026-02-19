import React from "react";

export default function ViewEligibleStudentModal({ viewEligibleStudent, setViewEligibleStudent }) {
  if (!viewEligibleStudent) return null;

  return (
    <div className="modal-overlay" onClick={() => setViewEligibleStudent(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Eligible Student Details</h3>
        <div className="view-grid">
          <p><strong>Full Name:</strong> {viewEligibleStudent.full_name || "-"}</p>
          <p><strong>Email:</strong> {viewEligibleStudent.email || "-"}</p>
          <p><strong>Contact:</strong> {viewEligibleStudent.contact || "-"}</p>
          <p><strong>Education Level:</strong> {viewEligibleStudent.class || "-"}</p>
          <p><strong>School:</strong> {viewEligibleStudent.school || "-"}</p>
          <p><strong>Date Added:</strong> {viewEligibleStudent.created_at ? new Date(viewEligibleStudent.created_at).toLocaleString() : "-"}</p>
          {viewEligibleStudent.student_id && (
            <p><strong>Student ID:</strong> {viewEligibleStudent.student_id}</p>
          )}
          {viewEligibleStudent.reason && (
            <p><strong>Eligibility Reason:</strong> {viewEligibleStudent.reason}</p>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn primary" onClick={() => setViewEligibleStudent(null)}>Close</button>
        </div>
      </div>
    </div>
  );
}
