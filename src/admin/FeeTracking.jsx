import React from "react";

export default function FeeTracking({
  feeSummary, feePayments, newPaymentForm, setNewPaymentForm,
  handleDownloadFeeReport, handleRecordPayment, handleDeletePayment,
}) {
  return (
    <section className="fees-section">
      <div className="section-header">
        <h3>Fee Tracking</h3>
        <div className="section-actions">
          <button className="btn" onClick={handleDownloadFeeReport}>Download Report</button>
        </div>
      </div>

      <div className="fee-summary">
        <div className="fee-card">
          <div className="amount">{"\u20B9"}{feeSummary.reduce((s, f) => s + (f.total_fee || 0), 0).toLocaleString()}</div>
          <div className="label">Total Fees</div>
        </div>
        <div className="fee-card">
          <div className="amount">{"\u20B9"}{feePayments.reduce((s, fp) => s + (parseFloat(fp.amount) || 0), 0).toLocaleString()}</div>
          <div className="label">Collected</div>
        </div>
        <div className="fee-card">
          <div className="amount">{"\u20B9"}{feeSummary.reduce((s, f) => s + Math.max(0, f.balance || 0), 0).toLocaleString()}</div>
          <div className="label">Pending</div>
        </div>
        <div className="fee-card">
          <div className="amount">
            {feeSummary.length > 0
              ? Math.round((feeSummary.filter((f) => f.status === "paid").length / feeSummary.length) * 100) + "%"
              : "0%"}
          </div>
          <div className="label">Fully Paid Rate</div>
        </div>
      </div>

      <div style={{ background: "#f9f9f9", padding: "16px", borderRadius: "8px", marginBottom: "20px" }}>
        <h4 style={{ marginBottom: "12px" }}>Record New Payment</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "flex-end" }}>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.85em" }}>
            Student ID *
            <input className="form-input" value={newPaymentForm.student_id} onChange={(e) => setNewPaymentForm((f) => ({ ...f, student_id: e.target.value }))} placeholder="e.g. 1" style={{ width: "80px" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.85em" }}>
            Amount *
            <input className="form-input" type="number" value={newPaymentForm.amount} onChange={(e) => setNewPaymentForm((f) => ({ ...f, amount: e.target.value }))} placeholder="0" style={{ width: "100px" }} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.85em" }}>
            Date *
            <input className="form-input" type="date" value={newPaymentForm.payment_date} onChange={(e) => setNewPaymentForm((f) => ({ ...f, payment_date: e.target.value }))} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.85em" }}>
            Method
            <select className="form-input" value={newPaymentForm.payment_method} onChange={(e) => setNewPaymentForm((f) => ({ ...f, payment_method: e.target.value }))}>
              <option value="cash">Cash</option>
              <option value="online">Online</option>
              <option value="cheque">Cheque</option>
            </select>
          </label>
          <label style={{ display: "flex", flexDirection: "column", fontSize: "0.85em" }}>
            Notes
            <input className="form-input" value={newPaymentForm.notes} onChange={(e) => setNewPaymentForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
          </label>
          <button className="btn primary" onClick={handleRecordPayment}>Record Payment</button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table" aria-label="Donor-student mapping">
          <thead>
            <tr>
              <th>Student</th>
              <th>Total Fee</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {feeSummary.map((s) => (
              <tr key={s.student_id}>
                <td>{s.student_name || `#${s.student_id}`}</td>
                <td>{"\u20B9"}{(s.total_fee || 0).toLocaleString()}</td>
                <td>{"\u20B9"}{(s.total_paid || 0).toLocaleString()}</td>
                <td>{"\u20B9"}{(s.balance || 0).toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${s.status}`}>
                    {s.status === "paid" ? "Paid" : s.status === "partial" ? "Partial" : "Pending"}
                  </span>
                </td>
              </tr>
            ))}
            {feeSummary.length === 0 && (
              <tr><td colSpan="5" style={{ textAlign: "center", color: "#888" }}>No fee data available</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {feePayments.length > 0 && (
        <div className="table-wrap" style={{ marginTop: "20px" }}>
          <h4>Recent Payments</h4>
          <table className="data-table" aria-label="Fee payment tracking">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Method</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feePayments.slice(0, 20).map((fp) => (
                <tr key={fp.id}>
                  <td>#{fp.student_id}</td>
                  <td>{"\u20B9"}{(parseFloat(fp.amount) || 0).toLocaleString()}</td>
                  <td>{fp.payment_date}</td>
                  <td>{fp.payment_method}</td>
                  <td>{fp.notes || "-"}</td>
                  <td>
                    <button className="btn small" style={{ color: "#c62828" }} onClick={() => handleDeletePayment(fp.id)}>Delete</button>
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
