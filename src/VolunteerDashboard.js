import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VolunteerDashboard.css";
import supabase from "./supabaseClient";

export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [volunteerName, setVolunteerName] = useState("Volunteer");
  const [volunteerEmail, setVolunteerEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [feeSummary, setFeeSummary] = useState([]);
  const [activeTab, setActiveTab] = useState("forms");
  const [donationForm, setDonationForm] = useState({ donor_name: "", donor_email: "", student_id: "", amount: "", payment_date: "", payment_method: "cash", notes: "" });
  const [feePaymentForm, setFeePaymentForm] = useState({ student_id: "", amount: "", payment_date: "", payment_method: "cash", notes: "" });
  const [donorMappingForm, setDonorMappingForm] = useState({ student_id: "", donor_name: "", donor_email: "", year_of_support: "", amount: "" });
  const [donations, setDonations] = useState([]);
  const [donorMappings, setDonorMappings] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [feeStructureForm, setFeeStructureForm] = useState({ student_id: "", total_fee: "", num_terms: "1", academic_year: "", notes: "" });
  const [feeStructureTerms, setFeeStructureTerms] = useState([]);

  useEffect(() => {
    const fetchVolunteerData = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setLoading(false);
        return;
      }

      const user = data.session.user;
      const email = user.email;

      setVolunteerEmail(email);
      setVolunteerName(
        user.user_metadata?.name || email.split("@")[0]
      );

      await fetchForms(email);

      // Fetch notifications for this volunteer
      const { data: notifs } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_email", email);
      if (notifs) setNotifications(notifs);

      // Fetch fee payment summary, donations, and donor mappings
      try {
        const axios = (await import("axios")).default;
        const [summaryResp, donationsResp, mappingsResp, feeStructResp] = await Promise.all([
          axios.get("/api/fee-payments/summary"),
          axios.get("/api/donations"),
          axios.get("/api/donor-mapping"),
          axios.get("/api/fee-structures"),
        ]);
        if (summaryResp.data?.data) setFeeSummary(summaryResp.data.data);
        if (donationsResp.data?.data) setDonations(donationsResp.data.data);
        if (mappingsResp.data?.data) setDonorMappings(mappingsResp.data.data);
        if (feeStructResp.data?.data) setFeeStructures(feeStructResp.data.data);
      } catch (e) {
        console.error("Data fetch error:", e);
      }
    };

    fetchVolunteerData();
  }, []);

  const fetchForms = async (volunteerEmail) => {
    setLoading(true);

    const { data, error } = await supabase
      .from("student_form_submissions")
      .select(
        "id, first_name, last_name, camp_name, created_at, age, school, class, volunteer_email"
      )
      .eq("volunteer_email", volunteerEmail)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching forms:", error);
      setLoading(false);
      return;
    }

    const transformedForms = (data || []).map((submission, index) => ({
      id: submission.id,
      displayId: index + 1,
      title: `${submission.first_name} ${submission.last_name}`,
      campName: submission.camp_name || "-",
      dateSubmitted: new Date(submission.created_at)
        .toISOString()
        .split("T")[0],
      details: `Student: ${submission.first_name} ${submission.last_name}, Age: ${submission.age}, School: ${submission.school}, Class: ${submission.class}`,
      dataForEdit: submission
    }));

    setForms(transformedForms);
    setLoading(false);
  };

  const handleFormClick = (id) => {
    setSelectedFormId(id);
  };

  const handleFillFormClick = () => {
    localStorage.removeItem("editFormData");
    navigate("/studentform");
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this form?")) return;

    const { error } = await supabase
      .from("student_form_submissions")
      .delete()
      .eq("id", parseInt(id));

    if (error) {
      alert("Error deleting form");
      return;
    }

    setForms((prev) => prev.filter((form) => form.id !== id));
    if (selectedFormId === id) setSelectedFormId(null);
  };

  const handleEditClick = (form) => {
    navigate(`/studentform/${form.id}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleRecordDonation = async () => {
    if (!donationForm.donor_name || !donationForm.amount) {
      alert("Donor name and amount are required.");
      return;
    }
    try {
      const { data, error } = await supabase.from("donations").insert({
        donor_name: donationForm.donor_name,
        donor_email: donationForm.donor_email || null,
        student_id: donationForm.student_id ? parseInt(donationForm.student_id) : null,
        amount: parseFloat(donationForm.amount),
        payment_date: donationForm.payment_date || new Date().toISOString().split("T")[0],
        payment_method: donationForm.payment_method,
        notes: donationForm.notes || null,
      });
      if (error) { alert("Error: " + error.message); return; }
      alert("Donation recorded!");
      setDonationForm({ donor_name: "", donor_email: "", student_id: "", amount: "", payment_date: "", payment_method: "cash", notes: "" });
      setDonations(prev => [data, ...prev]);
    } catch (err) {
      alert("Error recording donation.");
    }
  };

  const handleRecordFeePayment = async () => {
    if (!feePaymentForm.student_id || !feePaymentForm.amount) {
      alert("Student ID and amount are required.");
      return;
    }
    try {
      const { data, error } = await supabase.from("fee_payments").insert({
        student_id: parseInt(feePaymentForm.student_id),
        amount: parseFloat(feePaymentForm.amount),
        payment_date: feePaymentForm.payment_date || new Date().toISOString().split("T")[0],
        payment_method: feePaymentForm.payment_method,
        notes: feePaymentForm.notes || null,
      });
      if (error) { alert("Error: " + error.message); return; }
      alert("Fee payment recorded!");
      setFeePaymentForm({ student_id: "", amount: "", payment_date: "", payment_method: "cash", notes: "" });
    } catch (err) {
      alert("Error recording fee payment.");
    }
  };

  const handleCreateDonorMapping = async () => {
    if (!donorMappingForm.student_id || !donorMappingForm.donor_name) {
      alert("Student ID and donor name are required.");
      return;
    }
    try {
      const { data, error } = await supabase.from("donor_mapping").insert({
        student_id: parseInt(donorMappingForm.student_id),
        donor_name: donorMappingForm.donor_name,
        donor_email: donorMappingForm.donor_email || null,
        year_of_support: donorMappingForm.year_of_support || new Date().getFullYear().toString(),
        amount: parseFloat(donorMappingForm.amount) || 0,
        is_current_sponsor: 1,
      });
      if (error) { alert("Error: " + error.message); return; }
      alert("Donor mapped to student!");
      setDonorMappingForm({ student_id: "", donor_name: "", donor_email: "", year_of_support: "", amount: "" });
      setDonorMappings(prev => [data, ...prev]);
    } catch (err) {
      alert("Error creating donor mapping.");
    }
  };

  const handleFeeReceiptUpload = async (e, studentId) => {
    const file = e.target.files?.[0];
    if (!file || !studentId) return;
    try {
      const { error } = await supabase.storage
        .from("documents")
        .upload(`${studentId}/${file.name}`, file);
      if (error) { alert("Upload error: " + error.message); return; }
      alert("Fee receipt uploaded for student #" + studentId);
    } catch (err) {
      alert("Upload failed.");
    }
  };

  const handleNumTermsChange = (numTerms) => {
    const n = parseInt(numTerms) || 0;
    const totalFee = parseFloat(feeStructureForm.total_fee) || 0;
    const perTerm = n > 0 ? Math.round(totalFee / n) : 0;
    const terms = Array.from({ length: n }, (_, i) => ({
      term: i + 1,
      label: `Term ${i + 1}`,
      amount: perTerm,
      due_date: "",
    }));
    setFeeStructureTerms(terms);
    setFeeStructureForm(f => ({ ...f, num_terms: numTerms }));
  };

  const handleSaveFeeStructure = async () => {
    if (!feeStructureForm.student_id || !feeStructureForm.total_fee) {
      alert("Student and Total Fee are required."); return;
    }
    try {
      const axios = (await import("axios")).default;
      const resp = await axios.post("/api/fee-structures", {
        student_id: parseInt(feeStructureForm.student_id),
        total_fee: parseFloat(feeStructureForm.total_fee),
        num_terms: parseInt(feeStructureForm.num_terms) || 1,
        term_fees: feeStructureTerms,
        academic_year: feeStructureForm.academic_year || null,
        notes: feeStructureForm.notes || null,
      });
      if (resp.data?.error) { alert("Error: " + resp.data.error.message); return; }
      alert("Fee structure saved!");
      setFeeStructureForm({ student_id: "", total_fee: "", num_terms: "1", academic_year: "", notes: "" });
      setFeeStructureTerms([]);
      // Refresh fee structures
      const refreshResp = await axios.get("/api/fee-structures");
      if (refreshResp.data?.data) setFeeStructures(refreshResp.data.data);
    } catch (err) {
      alert("Error saving fee structure.");
    }
  };

  const selectedForm = forms.find((f) => f.id === selectedFormId);

  const thisMonthForms = forms.filter(
    (f) => new Date(f.dateSubmitted).getMonth() === new Date().getMonth()
  ).length;

  const lastMonthForms = forms.filter((f) => {
    const formDate = new Date(f.dateSubmitted);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return (
      formDate.getMonth() === lastMonth.getMonth() &&
      formDate.getFullYear() === lastMonth.getFullYear()
    );
  }).length;

  return (
    <div className="volunteer-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="profile">
            <h2>{volunteerName}</h2>
            <p>{volunteerEmail}</p>
          </div>

          <div className="stats">
            <div className="card">
              <h3>{thisMonthForms}</h3>
              <p>This Month</p>
            </div>
            <div className="card">
              <h3>{lastMonthForms}</h3>
              <p>Last Month</p>
            </div>
            <div className="card">
              <h3>{forms.length}</h3>
              <p>Total Forms</p>
            </div>
          </div>
        </div>

        <button className="sidebar-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="main-header">
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["forms", "donations", "fees", "fee-structures", "donors", "notifications"].map(tab => (
              <button
                key={tab}
                className={`btn ${activeTab === tab ? "primary" : ""}`}
                onClick={() => setActiveTab(tab)}
                style={{ textTransform: "capitalize" }}
              >
                {tab === "forms" ? "My Students" : tab === "donations" ? "Donations" : tab === "fees" ? "Fee Payments" : tab === "fee-structures" ? "Fee Structure" : tab === "donors" ? "Adopt a Child" : "Notifications"}
              </button>
            ))}
          </div>
          {activeTab === "forms" && (
            <button className="btn primary fill-form-btn" onClick={handleFillFormClick}>
              New Form
            </button>
          )}
        </div>

        {/* My Students Tab */}
        {activeTab === "forms" && (
          <>
            <div className="table-wrapper">
              {loading && (
                <div style={{ padding: 16, color: "#6b7280" }}>Loading forms...</div>
              )}
              <table className="forms-table">
                <thead>
                  <tr>
                    <th>Form ID</th>
                    <th>Name</th>
                    <th>Camp Name</th>
                    <th>Submitted Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.map((form) => (
                    <tr key={form.id} className={form.id === selectedFormId ? "selected" : ""}>
                      <td onClick={() => handleFormClick(form.id)}>{form.displayId}</td>
                      <td onClick={() => handleFormClick(form.id)}>{form.title}</td>
                      <td onClick={() => handleFormClick(form.id)}>{form.campName}</td>
                      <td onClick={() => handleFormClick(form.id)}>{form.dateSubmitted}</td>
                      <td>
                        <button className="btn primary small icon" onClick={() => handleEditClick(form)}>✎</button>
                        <button className="btn danger small icon" onClick={() => handleDeleteClick(form.id)}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && forms.length === 0 && (
                <div style={{ padding: 16, textAlign: "center", color: "#6b7280" }}>No submitted forms found for this volunteer.</div>
              )}
            </div>

            {selectedForm && (
              <div className="form-details">
                <h2>{selectedForm.title}</h2>
                <p>{selectedForm.details}</p>
              </div>
            )}

            {/* Fee Status for Assigned Students */}
            {forms.length > 0 && feeSummary.length > 0 && (() => {
              const studentIds = new Set(forms.map(f => f.id));
              const relevantFees = feeSummary.filter(fs => studentIds.has(fs.student_id));
              if (relevantFees.length === 0) return null;
              return (
                <div className="form-details" style={{ marginTop: "16px" }}>
                  <h2 style={{ marginBottom: "12px" }}>Fee Status — Your Students</h2>
                  <table className="forms-table">
                    <thead>
                      <tr><th>Student</th><th>Total Fee</th><th>Paid</th><th>Balance</th><th>Status</th><th>Upload Receipt</th></tr>
                    </thead>
                    <tbody>
                      {relevantFees.map(fs => (
                        <tr key={fs.student_id}>
                          <td>{fs.student_name || `#${fs.student_id}`}</td>
                          <td>{"\u20B9"}{(fs.total_fee || 0).toLocaleString()}</td>
                          <td>{"\u20B9"}{(fs.total_paid || 0).toLocaleString()}</td>
                          <td>{"\u20B9"}{(fs.balance || 0).toLocaleString()}</td>
                          <td>
                            <span style={{ color: fs.status === "paid" ? "#10b981" : fs.status === "partial" ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>
                              {fs.status === "paid" ? "Paid" : fs.status === "partial" ? "Partial" : "Pending"}
                            </span>
                          </td>
                          <td>
                            <label style={{ cursor: "pointer", color: "#3b82f6", fontSize: "0.9em" }}>
                              Upload
                              <input type="file" style={{ display: "none" }} onChange={(e) => handleFeeReceiptUpload(e, fs.student_id)} />
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </>
        )}

        {/* Donations Tab */}
        {activeTab === "donations" && (
          <div className="form-details">
            <h2 style={{ marginBottom: "16px" }}>Record a Donation</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <label>Donor Name *<input value={donationForm.donor_name} onChange={(e) => setDonationForm(f => ({ ...f, donor_name: e.target.value }))} /></label>
              <label>Donor Email<input type="email" value={donationForm.donor_email} onChange={(e) => setDonationForm(f => ({ ...f, donor_email: e.target.value }))} /></label>
              <label>Student ID (optional)<input type="number" value={donationForm.student_id} onChange={(e) => setDonationForm(f => ({ ...f, student_id: e.target.value }))} placeholder="Leave empty for general" /></label>
              <label>Amount (₹) *<input type="number" value={donationForm.amount} onChange={(e) => setDonationForm(f => ({ ...f, amount: e.target.value }))} /></label>
              <label>Payment Date<input type="date" value={donationForm.payment_date} onChange={(e) => setDonationForm(f => ({ ...f, payment_date: e.target.value }))} /></label>
              <label>Payment Method
                <select value={donationForm.payment_method} onChange={(e) => setDonationForm(f => ({ ...f, payment_method: e.target.value }))}>
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                  <option value="cheque">Cheque</option>
                  <option value="upi">UPI</option>
                </select>
              </label>
              <label style={{ gridColumn: "span 2" }}>Notes<input value={donationForm.notes} onChange={(e) => setDonationForm(f => ({ ...f, notes: e.target.value }))} /></label>
            </div>
            <button className="btn primary" onClick={handleRecordDonation}>Record Donation</button>

            {donations.length > 0 && (
              <>
                <h3 style={{ marginTop: "24px", marginBottom: "12px" }}>Recent Donations</h3>
                <table className="forms-table">
                  <thead><tr><th>Donor</th><th>Amount</th><th>Date</th><th>Method</th><th>Student</th></tr></thead>
                  <tbody>
                    {donations.slice(0, 20).map(d => (
                      <tr key={d.id}>
                        <td>{d.donor_name}</td>
                        <td>{"\u20B9"}{(parseFloat(d.amount) || 0).toLocaleString()}</td>
                        <td>{d.payment_date}</td>
                        <td>{d.payment_method}</td>
                        <td>{d.student_name || (d.student_id ? `#${d.student_id}` : "General")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* Fee Payments Tab */}
        {activeTab === "fees" && (
          <div className="form-details">
            <h2 style={{ marginBottom: "16px" }}>Record Fee Payment</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <label>Student ID *
                <select value={feePaymentForm.student_id} onChange={(e) => setFeePaymentForm(f => ({ ...f, student_id: e.target.value }))}>
                  <option value="">Select Student</option>
                  {forms.map(f => <option key={f.id} value={f.id}>{f.title} (#{f.id})</option>)}
                </select>
              </label>
              <label>Amount (₹) *<input type="number" value={feePaymentForm.amount} onChange={(e) => setFeePaymentForm(f => ({ ...f, amount: e.target.value }))} /></label>
              <label>Payment Date<input type="date" value={feePaymentForm.payment_date} onChange={(e) => setFeePaymentForm(f => ({ ...f, payment_date: e.target.value }))} /></label>
              <label>Payment Method
                <select value={feePaymentForm.payment_method} onChange={(e) => setFeePaymentForm(f => ({ ...f, payment_method: e.target.value }))}>
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                  <option value="cheque">Cheque</option>
                  <option value="upi">UPI</option>
                </select>
              </label>
              <label style={{ gridColumn: "span 2" }}>Notes<input value={feePaymentForm.notes} onChange={(e) => setFeePaymentForm(f => ({ ...f, notes: e.target.value }))} /></label>
            </div>
            <button className="btn primary" onClick={handleRecordFeePayment}>Record Payment</button>
          </div>
        )}

        {/* Fee Structure Tab */}
        {activeTab === "fee-structures" && (
          <div className="form-details">
            <h2 style={{ marginBottom: "16px" }}>Manage Fee Structure (Term-wise)</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <label>Student *
                <select value={feeStructureForm.student_id} onChange={(e) => setFeeStructureForm(f => ({ ...f, student_id: e.target.value }))}>
                  <option value="">Select Student</option>
                  {forms.map(f => <option key={f.id} value={f.id}>{f.title} (#{f.id})</option>)}
                </select>
              </label>
              <label>Total Fee (₹) *<input type="number" value={feeStructureForm.total_fee} onChange={(e) => setFeeStructureForm(f => ({ ...f, total_fee: e.target.value }))} /></label>
              <label>Number of Terms *<input type="number" min="1" max="12" value={feeStructureForm.num_terms} onChange={(e) => handleNumTermsChange(e.target.value)} /></label>
              <label>Academic Year<input value={feeStructureForm.academic_year} onChange={(e) => setFeeStructureForm(f => ({ ...f, academic_year: e.target.value }))} placeholder="e.g. 2025-26" /></label>
              <label style={{ gridColumn: "span 2" }}>Notes<input value={feeStructureForm.notes} onChange={(e) => setFeeStructureForm(f => ({ ...f, notes: e.target.value }))} /></label>
            </div>

            {feeStructureTerms.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <h3 style={{ marginBottom: "8px" }}>Term Details</h3>
                <table className="forms-table">
                  <thead><tr><th>Term</th><th>Label</th><th>Amount (₹)</th><th>Due Date</th></tr></thead>
                  <tbody>
                    {feeStructureTerms.map((term, idx) => (
                      <tr key={idx}>
                        <td>{term.term}</td>
                        <td><input value={term.label} onChange={(e) => { const t = [...feeStructureTerms]; t[idx] = { ...t[idx], label: e.target.value }; setFeeStructureTerms(t); }} /></td>
                        <td><input type="number" value={term.amount} onChange={(e) => { const t = [...feeStructureTerms]; t[idx] = { ...t[idx], amount: parseFloat(e.target.value) || 0 }; setFeeStructureTerms(t); }} /></td>
                        <td><input type="date" value={term.due_date} onChange={(e) => { const t = [...feeStructureTerms]; t[idx] = { ...t[idx], due_date: e.target.value }; setFeeStructureTerms(t); }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button className="btn primary" onClick={handleSaveFeeStructure}>Save Fee Structure</button>

            {feeStructures.length > 0 && (
              <>
                <h3 style={{ marginTop: "24px", marginBottom: "12px" }}>Existing Fee Structures</h3>
                <table className="forms-table">
                  <thead><tr><th>Student</th><th>Total Fee</th><th>Terms</th><th>Academic Year</th></tr></thead>
                  <tbody>
                    {feeStructures.map(fs => (
                      <tr key={fs.id}>
                        <td>{fs.student_name || `#${fs.student_id}`}</td>
                        <td>{"\u20B9"}{(fs.total_fee || 0).toLocaleString()}</td>
                        <td>{fs.num_terms} terms ({Array.isArray(fs.term_fees) ? fs.term_fees.map(t => `₹${t.amount}`).join(", ") : "—"})</td>
                        <td>{fs.academic_year || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* Adopt a Child / Donor Mapping Tab */}
        {activeTab === "donors" && (
          <div className="form-details">
            <h2 style={{ marginBottom: "16px" }}>Assign Donor to Student</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <label>Student *
                <select value={donorMappingForm.student_id} onChange={(e) => setDonorMappingForm(f => ({ ...f, student_id: e.target.value }))}>
                  <option value="">Select Student</option>
                  {forms.map(f => <option key={f.id} value={f.id}>{f.title} (#{f.id})</option>)}
                </select>
              </label>
              <label>Donor Name *<input value={donorMappingForm.donor_name} onChange={(e) => setDonorMappingForm(f => ({ ...f, donor_name: e.target.value }))} /></label>
              <label>Donor Email<input type="email" value={donorMappingForm.donor_email} onChange={(e) => setDonorMappingForm(f => ({ ...f, donor_email: e.target.value }))} /></label>
              <label>Year of Support<input value={donorMappingForm.year_of_support} onChange={(e) => setDonorMappingForm(f => ({ ...f, year_of_support: e.target.value }))} placeholder={new Date().getFullYear().toString()} /></label>
              <label>Sponsorship Amount (₹)<input type="number" value={donorMappingForm.amount} onChange={(e) => setDonorMappingForm(f => ({ ...f, amount: e.target.value }))} /></label>
            </div>
            <button className="btn primary" onClick={handleCreateDonorMapping}>Assign Donor</button>

            {donorMappings.length > 0 && (
              <>
                <h3 style={{ marginTop: "24px", marginBottom: "12px" }}>Current Donor Mappings</h3>
                <table className="forms-table">
                  <thead><tr><th>Student</th><th>Donor</th><th>Year</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {donorMappings.slice(0, 20).map(dm => (
                      <tr key={dm.id}>
                        <td>{dm.student_name || `#${dm.student_id}`}</td>
                        <td>{dm.donor_name}</td>
                        <td>{dm.year_of_support || "N/A"}</td>
                        <td>{"\u20B9"}{(parseFloat(dm.amount) || 0).toLocaleString()}</td>
                        <td style={{ color: dm.is_current_sponsor ? "#10b981" : "#888", fontWeight: 600 }}>
                          {dm.is_current_sponsor ? "Active" : "Past"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === "notifications" && (
          <div className="form-details">
            <h2 style={{ marginBottom: "12px" }}>
              Notifications ({notifications.filter(n => !n.is_read).length} unread)
            </h2>
            {notifications.length === 0 ? (
              <p style={{ color: "#888" }}>No notifications.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: "10px 12px",
                    marginBottom: "8px",
                    background: n.is_read ? "#f9f9f9" : "#eef6ff",
                    borderRadius: "6px",
                    borderLeft: `3px solid ${n.priority === "high" ? "#e74c3c" : n.priority === "medium" ? "#f39c12" : "#3b82f6"}`,
                  }}
                >
                  <strong>{n.title}</strong>
                  {n.message && <p style={{ margin: "4px 0 0", color: "#555", fontSize: "0.9em" }}>{n.message}</p>}
                  <small style={{ color: "#999" }}>{n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}</small>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
