import React from "react";

export default function ReportsExports({
  reportStartDate, setReportStartDate,
  reportEndDate, setReportEndDate,
  filteredFeeSummary, setFilteredFeeSummary,
  filteredDonationSummary, setFilteredDonationSummary,
  feeSummary, feePayments, donors, donorMappings, students,
  eligibleCount, nonEligibleCount,
  eligibleStudents, nonEligibleStudents,
  loadingEligible, loadingNonEligible,
  activeReportList, setActiveReportList,
  fetchEligibleStudents, fetchNonEligibleStudents,
  handleGenerateReport, handleDownloadFeeReport,
  handleExportDonorReport, handleDownloadEligibleReport, handleDownloadNonEligibleReport,
  exportPDF,
  setViewEligibleStudent, setViewNonEligibleStudent,
}) {
  return (
    <section className="reports-section">
      <div className="section-header">
        <h3>Reports & Analytics</h3>
        <div className="section-actions" style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: "0.85em" }}>From: <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} /></label>
          <label style={{ fontSize: "0.85em" }}>To: <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} /></label>
          <button className="btn primary" onClick={handleGenerateReport}>Filter Reports</button>
          {(filteredFeeSummary || filteredDonationSummary) && (
            <button className="btn" onClick={() => { setFilteredFeeSummary(null); setFilteredDonationSummary(null); setReportStartDate(""); setReportEndDate(""); }}>Clear Filter</button>
          )}
        </div>
      </div>

      <div className="reports-grid">
        {/* Financial Overview */}
        <div className="report-card">
          <h4>Financial Overview {filteredFeeSummary ? "(Filtered)" : ""}</h4>
          <div className="report-meta">
            {(() => {
              const data = filteredFeeSummary || feeSummary;
              return (<>
                <p>Total Fees: <strong>{"\u20B9"}{data.reduce((s, f) => s + (f.total_fee || 0), 0).toLocaleString()}</strong></p>
                <p>Collected: <strong>{"\u20B9"}{data.reduce((s, f) => s + (f.total_paid || 0), 0).toLocaleString()}</strong></p>
                <p>Pending: <strong>{"\u20B9"}{data.reduce((s, f) => s + Math.max(0, f.balance || 0), 0).toLocaleString()}</strong></p>
              </>);
            })()}
          </div>
          <button className="btn small" onClick={handleDownloadFeeReport}>Download CSV</button>
          <button className="btn small" style={{ marginLeft: "4px" }} onClick={() => {
            const data = filteredFeeSummary || feeSummary;
            exportPDF("Financial Overview", ["Student", "Total Fee", "Paid", "Balance", "Status"],
              data.map((f) => [f.student_name || f.student_id, f.total_fee || 0, f.total_paid || 0, f.balance || 0, f.status]),
              "financial_overview.pdf");
          }}>Export PDF</button>
        </div>

        {/* Donor Contributions */}
        <div className="report-card">
          <h4>Donor Contributions {filteredDonationSummary ? "(Filtered)" : ""}</h4>
          <div className="report-meta">
            {filteredDonationSummary ? (<>
              <p>Total Donated: <strong>{"\u20B9"}{(filteredDonationSummary.total || 0).toLocaleString()}</strong></p>
              <p>Unique Donors: <strong>{filteredDonationSummary.byDonor?.length || 0}</strong></p>
              <p>Months: <strong>{filteredDonationSummary.byMonth?.length || 0}</strong></p>
            </>) : (<>
              <p>Total Donors: <strong>{donors.length}</strong></p>
              <p>Total Mapped: <strong>{"\u20B9"}{donorMappings.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0).toLocaleString()}</strong></p>
              <p>Students Supported: <strong>{new Set(donorMappings.map((d) => d.student_id)).size}</strong></p>
            </>)}
          </div>
          <button className="btn small" onClick={handleExportDonorReport}>Download CSV</button>
          <button className="btn small" style={{ marginLeft: "4px" }} onClick={() => {
            exportPDF("Donor Contributions", ["ID", "Name", "Amount", "Years"],
              donors.map((d) => [d.id, d.name, d.amount, d.years]),
              "donor_contributions.pdf");
          }}>Export PDF</button>
        </div>

        {/* Eligible Students */}
        <div className="report-card">
          <h4>Eligible Students</h4>
          <div className="report-meta">
            <p>Total Eligible: <strong>{eligibleCount}</strong></p>
          </div>
          <div className="report-actions">
            <button className="btn small" onClick={() => { setActiveReportList("eligible"); fetchEligibleStudents(); setTimeout(() => { window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }, 200); }} disabled={loadingEligible}>
              {loadingEligible ? "Loading..." : "View Data"}
            </button>
            <button className="btn small" onClick={handleDownloadEligibleReport} disabled={eligibleStudents.length === 0}>Download CSV</button>
            <button className="btn small" style={{ marginLeft: "4px" }} disabled={eligibleStudents.length === 0} onClick={() => {
              exportPDF("Eligible Students", ["ID", "Name", "Email", "Contact", "Education", "School"],
                eligibleStudents.map((s) => [s.id, s.student_name || "", s.email || "", s.contact || "", s.education || "", s.school || s.college || ""]),
                "eligible_students.pdf");
            }}>Export PDF</button>
          </div>
        </div>

        {/* Non-Eligible Students */}
        <div className="report-card">
          <h4>Non-Eligible Students</h4>
          <div className="report-meta">
            <p>Total Non-Eligible: <strong>{nonEligibleCount}</strong></p>
          </div>
          <div className="report-actions">
            <button className="btn small" onClick={() => { setActiveReportList("nonEligible"); fetchNonEligibleStudents(); setTimeout(() => { window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }, 200); }} disabled={loadingNonEligible}>
              {loadingNonEligible ? "Loading..." : "View Data"}
            </button>
            <button className="btn small" onClick={handleDownloadNonEligibleReport} disabled={nonEligibleStudents.length === 0}>Download CSV</button>
            <button className="btn small" style={{ marginLeft: "4px" }} disabled={nonEligibleStudents.length === 0} onClick={() => {
              exportPDF("Non-Eligible Students", ["ID", "Name", "Email", "Contact", "Education", "School"],
                nonEligibleStudents.map((s) => [s.id, s.student_name || "", s.email || "", s.contact || "", s.education || "", s.school || s.college || ""]),
                "non_eligible_students.pdf");
            }}>Export PDF</button>
          </div>
        </div>

        {/* Fee Paid vs Pending */}
        <div className="report-card">
          <h4>Fee Paid vs Pending {filteredFeeSummary ? "(Filtered)" : ""}</h4>
          <div className="report-meta">
            {(() => {
              const data = filteredFeeSummary || feeSummary;
              return (<>
                <p>Fully Paid: <strong>{data.filter((f) => f.status === "paid").length}</strong></p>
                <p>Partial: <strong>{data.filter((f) => f.status === "partial").length}</strong></p>
                <p>Pending: <strong>{data.filter((f) => f.status === "pending").length}</strong></p>
              </>);
            })()}
          </div>
          <button className="btn small" onClick={() => {
            const rows = ["Student,Total Fee,Paid,Balance,Status", ...feeSummary.map((f) => `"${f.student_name || f.student_id}",${f.total_fee || 0},${f.total_paid || 0},${f.balance || 0},${f.status}`)];
            const blob = new Blob([rows.join("\n")], { type: "text/csv" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "fee_paid_vs_pending.csv"; a.click();
          }}>Download CSV</button>
          <button className="btn small" style={{ marginLeft: "4px" }} onClick={() => {
            const data = filteredFeeSummary || feeSummary;
            exportPDF("Fee Paid vs Pending", ["Student", "Total Fee", "Paid", "Balance", "Status"],
              data.map((f) => [f.student_name || f.student_id, f.total_fee || 0, f.total_paid || 0, f.balance || 0, f.status]),
              "fee_paid_vs_pending.pdf");
          }}>Export PDF</button>
        </div>

        {/* Collections vs Requirements */}
        <div className="report-card">
          <h4>Collections vs Requirements</h4>
          <div className="report-meta">
            <p>Total Required: <strong>{"\u20B9"}{feeSummary.reduce((s, f) => s + (f.total_fee || 0), 0).toLocaleString()}</strong></p>
            <p>Total Collected: <strong>{"\u20B9"}{feePayments.reduce((s, fp) => s + (parseFloat(fp.amount) || 0), 0).toLocaleString()}</strong></p>
            <p>Gap: <strong>{"\u20B9"}{Math.max(0, feeSummary.reduce((s, f) => s + (f.total_fee || 0), 0) - feePayments.reduce((s, fp) => s + (parseFloat(fp.amount) || 0), 0)).toLocaleString()}</strong></p>
            <p>Donation Total: <strong>{"\u20B9"}{donorMappings.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0).toLocaleString()}</strong></p>
          </div>
          <button className="btn small" onClick={() => {
            const totalReq = feeSummary.reduce((s, f) => s + (f.total_fee || 0), 0);
            const totalCol = feePayments.reduce((s, fp) => s + (parseFloat(fp.amount) || 0), 0);
            const rows = ["Metric,Amount", `Total Required,${totalReq}`, `Total Collected,${totalCol}`, `Gap,${Math.max(0, totalReq - totalCol)}`, `Donations Mapped,${donorMappings.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0)}`];
            const blob = new Blob([rows.join("\n")], { type: "text/csv" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "collections_vs_requirements.csv"; a.click();
          }}>Download CSV</button>
          <button className="btn small" style={{ marginLeft: "4px" }} onClick={() => {
            const totalReq = feeSummary.reduce((s, f) => s + (f.total_fee || 0), 0);
            const totalCol = feePayments.reduce((s, fp) => s + (parseFloat(fp.amount) || 0), 0);
            exportPDF("Collections vs Requirements", ["Metric", "Amount"],
              [["Total Required", totalReq], ["Total Collected", totalCol], ["Gap", Math.max(0, totalReq - totalCol)], ["Donations Mapped", donorMappings.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0)]],
              "collections_vs_requirements.pdf");
          }}>Export PDF</button>
        </div>

        {/* Student-wise Breakdown */}
        <div className="report-card">
          <h4>Student-wise Breakdown</h4>
          <div className="report-meta">
            <p>Total Students: <strong>{students.length}</strong></p>
            <p>With Fee Data: <strong>{feeSummary.length}</strong></p>
            <p>With Donors: <strong>{new Set(donorMappings.map((d) => d.student_id)).size}</strong></p>
          </div>
          <button className="btn small" onClick={() => {
            const rows = ["Student ID,Name,Education,Fee Total,Fee Paid,Balance,Status,Donor"];
            students.forEach((s) => {
              const fee = feeSummary.find((f) => f.student_id === s.id) || {};
              const donor = donorMappings.find((d) => d.student_id === s.id);
              rows.push(`${s.id},"${s.name}","${s.course || ""}",${fee.total_fee || 0},${fee.total_paid || 0},${fee.balance || 0},${fee.status || "N/A"},"${donor ? donor.donor_name : "None"}"`);
            });
            const blob = new Blob([rows.join("\n")], { type: "text/csv" });
            const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "student_wise_breakdown.csv"; a.click();
          }}>Download CSV</button>
          <button className="btn small" style={{ marginLeft: "4px" }} onClick={() => {
            exportPDF("Student-wise Breakdown", ["ID", "Name", "Education", "Fee Total", "Paid", "Balance", "Status", "Donor"],
              students.map((s) => {
                const fee = feeSummary.find((f) => f.student_id === s.id) || {};
                const donor = donorMappings.find((d) => d.student_id === s.id);
                return [s.id, s.name, s.course || "", fee.total_fee || 0, fee.total_paid || 0, fee.balance || 0, fee.status || "N/A", donor ? donor.donor_name : "None"];
              }),
              "student_wise_breakdown.pdf");
          }}>Export PDF</button>
        </div>
      </div>

      {/* Eligible Students Table */}
      {activeReportList === "eligible" && (
        <div className="table-wrap" style={{ marginTop: "24px" }}>
          <h3>Eligible Students List</h3>
          <table className="data-table" aria-label="Non-eligible students">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Education</th>
                <th>School/College</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {eligibleStudents.map((s) => (
                <tr key={s.id}>
                  <td>{s.student_name || s.full_name}</td>
                  <td>{s.email || s.email}</td>
                  <td>{s.contact || s.contact}</td>
                  <td>{s.education || s.class}</td>
                  <td>{s.school || s.college || "-"}</td>
                  <td>{s.created_at ? new Date(s.created_at).toLocaleDateString() : "-"}</td>
                  <td>
                    <button className="btn small" onClick={() => setViewEligibleStudent(s)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Non-Eligible Students Table */}
      {activeReportList === "nonEligible" && (
        <div className="table-wrap" style={{ marginTop: "24px" }}>
          <h3>Non-Eligible Students List</h3>
          <table className="data-table" aria-label="Notifications">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Education</th>
                <th>School/College</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {nonEligibleStudents.map((s) => (
                <tr key={s.id}>
                  <td>{s.student_name || s.full_name}</td>
                  <td>{s.email || s.email}</td>
                  <td>{s.contact || s.contact}</td>
                  <td>{s.education || s.class}</td>
                  <td>{s.school || s.college || "-"}</td>
                  <td>{s.created_at ? new Date(s.created_at).toLocaleDateString() : "-"}</td>
                  <td>
                    <button className="btn small" onClick={() => setViewNonEligibleStudent(s)}>View</button>
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
