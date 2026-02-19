import React from "react";

export default function ViewNonEligibleStudentModal({ viewNonEligibleStudent, setViewNonEligibleStudent }) {
  if (!viewNonEligibleStudent) return null;

  return (
    <div className="modal-overlay" onClick={() => setViewNonEligibleStudent(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Non-Eligible Student Details</h3>
        <div className="view-grid">
          <p><strong>Full Name:</strong> {viewNonEligibleStudent.full_name || "-"}</p>
          <p><strong>Email:</strong> {viewNonEligibleStudent.email || "-"}</p>
          <p><strong>Contact:</strong> {viewNonEligibleStudent.contact || "-"}</p>
          <p><strong>Education Level:</strong> {viewNonEligibleStudent.class || "-"}</p>
          <p><strong>Camp Name:</strong> {viewNonEligibleStudent.camp_name || "-"}</p>
          <p><strong>School:</strong> {viewNonEligibleStudent.school || "-"}</p>
          <p><strong>Date Added:</strong> {viewNonEligibleStudent.created_at ? new Date(viewNonEligibleStudent.created_at).toLocaleString() : "-"}</p>
          {viewNonEligibleStudent.student_id && (
            <p><strong>Student ID:</strong> {viewNonEligibleStudent.student_id}</p>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn primary" onClick={() => setViewNonEligibleStudent(null)}>Close</button>
        </div>
      </div>
    </div>
  );
}
