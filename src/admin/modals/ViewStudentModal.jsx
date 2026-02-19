import React from "react";
import { toast } from "react-toastify";
import AcademicRecordsPanel from "../../AcademicRecordsPanel";

export default function ViewStudentModal({ viewStudent, viewStudentDocs, setViewStudent, setViewStudentDocs, currentUser }) {
  if (!viewStudent) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>Student Details</h3>

        <div className="view-grid">
          <p><strong>Full Name:</strong> {viewStudent.full_name}</p>
          <p><strong>Age:</strong> {viewStudent.age}</p>

          <p><strong>Father's Name:</strong> {viewStudent.father_name || "\u2014"}</p>
          <p><strong>Mother's Name:</strong> {viewStudent.mother_name || "\u2014"}</p>
          <p><strong>Guardian's Name:</strong> {viewStudent.guardian_name || "\u2014"}</p>
          <p><strong>Head of Family:</strong> {viewStudent.head_of_family || "\u2014"}</p>
          <p><strong>Income Source:</strong> {viewStudent.income_source || "\u2014"}</p>
          <p><strong>Monthly Income:</strong> {viewStudent.monthly_income ? `\u20B9${viewStudent.monthly_income}` : "\u2014"}</p>
          <p><strong>No. of Dependents:</strong> {viewStudent.num_dependents || "\u2014"}</p>
          <p><strong>School/College Address:</strong> {viewStudent.school_address || "\u2014"}</p>

          <p><strong>Camp Name:</strong> {viewStudent.camp}</p>
          <p><strong>Camp Date:</strong> {viewStudent.campDate}</p>

          <p><strong>Class / Year:</strong> {viewStudent.class}</p>
          <p><strong>Previous %:</strong> {viewStudent.prev_percent}</p>
          <p><strong>Present %:</strong> {viewStudent.present_percent}</p>

          <p><strong>Email:</strong> {viewStudent.email}</p>
          <p><strong>Contact:</strong> {viewStudent.contact}</p>
          <p><strong>WhatsApp:</strong> {viewStudent.whatsapp}</p>
          <p><strong>Student Contact:</strong> {viewStudent.student_contact}</p>

          <p><strong>Scholarship Type:</strong> {viewStudent.scholarship}</p>
          <p><strong>Has Scholarship:</strong> {viewStudent.has_scholarship ? "Yes" : "No"}</p>
          <p><strong>Does Student Work?:</strong> {viewStudent.does_work ? "Yes" : "No"}</p>
          <p><strong>Earning Members:</strong> {viewStudent.earning_members}</p>

          <p><strong>Donor / Volunteer:</strong> {viewStudent.donor}</p>
          <p><strong>Record Created:</strong> {viewStudent.created_at ? new Date(viewStudent.created_at).toLocaleString() : "\u2014"}</p>
        </div>

        <div style={{ marginTop: "20px" }}>
          <h4>Documents</h4>
          {viewStudentDocs.length > 0 ? (
            <table className="data-table" aria-label="Financial reports" style={{ fontSize: "0.85em", marginTop: "8px" }}>
              <thead><tr><th>File</th><th>Category</th><th>Uploaded</th><th>Action</th></tr></thead>
              <tbody>
                {viewStudentDocs.map((d) => (
                  <tr key={d.id}>
                    <td>{d.file_name}</td>
                    <td>{d.category}</td>
                    <td>{d.created_at ? new Date(d.created_at).toLocaleDateString() : "\u2014"}</td>
                    <td>
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer" style={{ color: "#1976d2" }}>Download</a>
                      {" "}
                      <button className="btn small" style={{ color: "#c62828", fontSize: "0.85em" }} onClick={async () => {
                        if (!window.confirm("Delete this document?")) return;
                        try {
                          const axios = (await import("axios")).default;
                          await axios.delete(`/api/documents/${d.id}`);
                          setViewStudentDocs((prev) => prev.filter((x) => x.id !== d.id));
                        } catch (e) {
                          toast.error("Error deleting.");
                        }
                      }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (<p style={{ color: "#888", fontSize: "0.9em" }}>No documents uploaded.</p>)}
          <label style={{ display: "inline-block", marginTop: "8px", cursor: "pointer", color: "#1976d2", fontSize: "0.9em" }}>
            Upload Document
            <input type="file" style={{ display: "none" }} onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || !viewStudent) return;
              try {
                const axios = (await import("axios")).default;
                const formData = new FormData();
                formData.append("file", file);
                formData.append("student_id", viewStudent.id);
                formData.append("uploaded_by", currentUser?.email || "admin");
                formData.append("category", "admin_upload");
                const { data: resp } = await axios.post("/api/documents", formData);
                if (resp?.data) setViewStudentDocs((prev) => [resp.data, ...prev]);
                toast.success("Document uploaded!");
              } catch (err) {
                toast.error("Upload failed.");
              }
            }} />
          </label>
        </div>

        <div style={{ marginTop: "20px" }}>
          <AcademicRecordsPanel studentId={viewStudent.id} readOnly={false} compact={true} />
        </div>

        <button className="btn primary" style={{ marginTop: "20px" }} onClick={() => { setViewStudent(null); setViewStudentDocs([]); }}>
          Close
        </button>
      </div>
    </div>
  );
}
