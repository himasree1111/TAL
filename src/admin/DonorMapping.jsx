import React from "react";

export default function DonorMapping({
  donorMappings, donors, newDonorForm, setNewDonorForm,
  handleExportDonorReport, handleAddDonor, handleDeleteDonorMapping,
  handleContactDonor, setViewDonor,
}) {
  return (
    <section className="mapping-section">
      <div className="section-header">
        <h3>Donor Mapping</h3>
        <div className="section-actions">
          <button className="btn primary" onClick={handleExportDonorReport}>Export Report</button>
        </div>
      </div>

      <div className="mapping-stats">
        <div className="stat-box">
          <div className="value">{"\u20B9"}{donorMappings.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0).toLocaleString()}</div>
          <div className="label">Total Funds Mapped</div>
        </div>
        <div className="stat-box">
          <div className="value">{new Set(donorMappings.map((d) => d.student_id)).size}</div>
          <div className="label">Students Supported</div>
        </div>
        <div className="stat-box">
          <div className="value">{donors.length}</div>
          <div className="label">Active Donors</div>
        </div>
      </div>

      <div style={{ background: "#f9f9f9", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
        <h4 style={{ marginBottom: "12px" }}>Add New Donor Mapping</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "flex-end" }}>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.85em" }}>
            Student ID
            <input className="form-input" value={newDonorForm.student_id} onChange={(e) => setNewDonorForm((f) => ({ ...f, student_id: e.target.value }))} placeholder="e.g. 1" style={{ width: "80px" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.85em" }}>
            Donor Name *
            <input className="form-input" value={newDonorForm.donor_name} onChange={(e) => setNewDonorForm((f) => ({ ...f, donor_name: e.target.value }))} placeholder="Name" />
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.85em" }}>
            Donor Email
            <input className="form-input" value={newDonorForm.donor_email} onChange={(e) => setNewDonorForm((f) => ({ ...f, donor_email: e.target.value }))} placeholder="email@example.com" />
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.85em" }}>
            Year
            <input className="form-input" value={newDonorForm.year_of_support} onChange={(e) => setNewDonorForm((f) => ({ ...f, year_of_support: e.target.value }))} placeholder="2025-2026" style={{ width: "100px" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.85em" }}>
            Amount
            <input className="form-input" type="number" value={newDonorForm.amount} onChange={(e) => setNewDonorForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" style={{ width: "100px" }} />
          </label>
          <button className="btn primary" onClick={handleAddDonor}>Add Mapping</button>
        </div>
      </div>

      <div className="mapping-grid">
        {donors.map((d) => (
          <div key={d.id} className="map-card">
            <div className="map-name">{d.name}</div>
            <div className="map-stats">
              <div className="map-stat">
                <div className="label">Total Amount</div>
                <div className="value">{"\u20B9"}{(d.amount || 0).toLocaleString()}</div>
              </div>
              <div className="map-stat">
                <div className="label">Duration</div>
                <div className="value">{d.years}</div>
              </div>
              <div className="map-stat">
                <div className="label">Students</div>
                <div className="value">{d.students}</div>
              </div>
            </div>
            <div style={{ marginTop: "12px" }}>
              <button className="btn small" onClick={() => setViewDonor(d)}>View Details</button>
              {d.email && (
                <button className="btn small" style={{ marginLeft: "8px" }} onClick={() => handleContactDonor(d)}>Contact</button>
              )}
            </div>
          </div>
        ))}
        {donors.length === 0 && <p style={{ color: "#888" }}>No donor mappings yet. Add one above.</p>}
      </div>

      {donorMappings.length > 0 && (
        <div className="table-wrap" style={{ marginTop: "20px" }}>
          <h4>All Donor-Student Mappings</h4>
          <table className="data-table" aria-label="Eligible students">
            <thead>
              <tr>
                <th>Donor</th>
                <th>Student</th>
                <th>Amount</th>
                <th>Year</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {donorMappings.map((dm) => (
                <tr key={dm.id}>
                  <td>{dm.donor_name}</td>
                  <td>{dm.student_name || `#${dm.student_id}`}</td>
                  <td>{"\u20B9"}{(parseFloat(dm.amount) || 0).toLocaleString()}</td>
                  <td>{dm.year_of_support || "N/A"}</td>
                  <td><span style={{ color: dm.is_current_sponsor ? "#2e7d32" : "#888" }}>{dm.is_current_sponsor ? "Active" : "Past"}</span></td>
                  <td>
                    <button className="btn small" style={{ color: "#c62828" }} onClick={() => handleDeleteDonorMapping(dm.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
