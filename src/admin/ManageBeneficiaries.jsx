import React from "react";

export default function ManageBeneficiaries({
  filters, setFilters, donors, uniqueCourses, filteredStudents, students, lastFetch,
  setShowAddStudentModal, exportCSV, exportPDF, setViewStudent, setViewStudentDocs,
  setEditStudentModal, handleApprove, handleNotApprove, handleDeleteStudent,
}) {
  return (
    <section className="manage-section">
      <div className="manage-controls">
        <div className="filters">
          <select value={filters.class} onChange={(e) => setFilters((f) => ({ ...f, class: e.target.value }))}>
            <option value="">All Years</option>
            <option>1st</option>
            <option>2nd</option>
            <option>3rd</option>
            <option>4th</option>
          </select>

          <select value={filters.donor} onChange={(e) => setFilters((f) => ({ ...f, donor: e.target.value }))}>
            <option value="">All Donors</option>
            <option>None</option>
            {donors.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>

          <select value={filters.feeStatus} onChange={(e) => setFilters((f) => ({ ...f, feeStatus: e.target.value }))}>
            <option value="">All Fee Status</option>
            <option>Paid</option>
            <option>Partial</option>
            <option>Pending</option>
          </select>

          <select value={filters.stream} onChange={(e) => setFilters((f) => ({ ...f, stream: e.target.value }))}>
            <option value="">All Streams</option>
            {uniqueCourses.map((c, idx) => (
              <option key={idx} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="manage-actions">
          <button className="btn primary" onClick={() => setShowAddStudentModal(true)}>+ Add Student</button>
          <button className="btn primary" onClick={exportCSV}>Export CSV</button>
          <button
            className="btn primary"
            style={{ marginLeft: "4px" }}
            onClick={() => {
              exportPDF(
                "Beneficiaries Report",
                ["ID", "Name", "College", "Year", "Donor", "Fee Status"],
                students.map((s) => [s.id, s.name, s.college, s.year, s.donor, s.feeStatus]),
                "beneficiaries.pdf"
              );
            }}
          >
            Export PDF
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table" aria-label="Student beneficiaries">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Education</th>
              <th>Contact</th>
              <th>Camp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.year}</td>
                <td>{s.contact}</td>
                <td>
                  <div style={{ whiteSpace: "nowrap" }}>
                    <div>{s.campName}</div>
                    <div style={{ fontSize: "0.85em", color: "#666" }}>{s.campDate}</div>
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div className="tooltip">
                      <button
                        className="btn small icon-btn"
                        onClick={async () => {
                          setViewStudent(s);
                          try {
                            const axios = (await import("axios")).default;
                            const { data: docsResp } = await axios.get(`/api/documents?student_id=${s.id}`);
                            setViewStudentDocs(docsResp?.data || []);
                          } catch (e) {
                            setViewStudentDocs([]);
                          }
                        }}
                        style={{ backgroundColor: "#e3f2fd", color: "#1976d2", borderColor: "#1976d2" }}
                      >
                        👁️
                      </button>
                      <span className="tooltiptext">View</span>
                    </div>
                    <div className="tooltip">
                      <button
                        className="btn small icon-btn"
                        onClick={() =>
                          setEditStudentModal({
                            id: s.id,
                            first_name: s.name?.split(" ")[0] || "",
                            last_name: s.name?.split(" ").slice(1).join(" ") || "",
                            email: s.email || "",
                            contact: s.contact || "",
                            school: s.school || "",
                            class: s.class || s.year || "",
                            educationcategory: s.course || "",
                            fee_structure: s.fee_status || "",
                            address: s.address || "",
                            father_name: s.father_name || "",
                            mother_name: s.mother_name || "",
                            guardian_name: s.guardian_name || "",
                            head_of_family: s.head_of_family || "",
                            income_source: s.income_source || "",
                            monthly_income: s.monthly_income || "",
                            num_dependents: s.num_dependents || "",
                            school_address: s.school_address || "",
                          })
                        }
                        style={{ backgroundColor: "#fff3e0", color: "#e65100", borderColor: "#e65100" }}
                      >
                        ✎
                      </button>
                      <span className="tooltiptext">Edit</span>
                    </div>
                    <div className="tooltip">
                      <button className="btn small icon-btn" onClick={() => handleApprove(s.id)} style={{ backgroundColor: "#e8f5e8", color: "#2e7d32", borderColor: "#2e7d32" }}>✅</button>
                      <span className="tooltiptext">Approved</span>
                    </div>
                    <div className="tooltip">
                      <button className="btn small icon-btn" onClick={() => handleNotApprove(s.id)} style={{ backgroundColor: "#ffebee", color: "#c62828", borderColor: "#c62828" }}>❌</button>
                      <span className="tooltiptext">Not Approved</span>
                    </div>
                    <div className="tooltip">
                      <button className="btn small icon-btn" onClick={() => handleDeleteStudent(s.id)} style={{ backgroundColor: "#ffebee", color: "#c62828", borderColor: "#c62828" }}>🗑</button>
                      <span className="tooltiptext">Delete</span>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {students.length === 0 && lastFetch && (
        <div className="debug-panel">
          <h4>No more forms to Review</h4>
        </div>
      )}
    </section>
  );
}
