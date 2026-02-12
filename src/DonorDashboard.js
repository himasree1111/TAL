import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  Settings,
  LogOut,
  BookOpen,
  Heart,
  ChevronDown,
  FileText,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import "./DonorDashboard.css";
import supabase from "./supabaseClient";

// --- Navigation Items ---
const NAV_ITEMS = [
  { name: "Dashboard", icon: Home, active: true },
  { name: "Donations & Reports", icon: FileText },
  { name: "Student Impact", icon: BookOpen },
  { name: "Analytics", icon: BarChart3 },
];

const DONOR_ITEMS = [
  { name: "My Profile", icon: Users },
  { name: "Settings", icon: Settings },
  { name: "Support", icon: Heart },
];

// --- Sidebar ---
const Sidebar = ({ onLogout }) => (
  <aside className="sidebar">
    <div>
      <h1 className="logo-text">Touch A Life</h1>
      <nav className="nav-menu">
        {NAV_ITEMS.map((item) => (
          <a key={item.name} href="#" className={`nav-item ${item.active ? "active" : ""}`}>
            <item.icon size={18} className="nav-icon" />
            {item.name}
          </a>
        ))}
      </nav>
      <hr className="divider" />
      <nav className="nav-menu">
        {DONOR_ITEMS.map((item) => (
          <a key={item.name} href="#" className="nav-item">
            <item.icon size={18} className="nav-icon" />
            {item.name}
          </a>
        ))}
        <a onClick={onLogout} className="nav-item" style={{ cursor: "pointer" }}>
          <LogOut size={18} className="nav-icon" />
          Logout
        </a>
      </nav>
    </div>
    <div className="support-box">
      <div className="support-graphic">[Support Graphic]</div>
      <p className="support-text">24/7 Support</p>
    </div>
  </aside>
);

// --- Metric Card ---
const MetricCard = ({ title, value, change, color }) => (
  <div className="metric-card">
    <div className="card-content">
      <p className="card-title">{title}</p>
      <h2 className="card-value">
        {title.toLowerCase().includes("donated") || title.toLowerCase().includes("amount")
          ? `₹${(value || 0).toLocaleString()}`
          : value}
      </h2>
      <p className={`card-change ${color === "green" ? "positive-change" : ""}`}>{change}</p>
    </div>
    <div className={`card-icon-wrapper icon-${color}`}>
      {color === "green" ? (
        <TrendingUp size={22} />
      ) : color === "blue" ? (
        <BookOpen size={22} />
      ) : (
        <BarChart3 size={22} />
      )}
    </div>
  </div>
);

// --- Main Donor Dashboard ---
const DonorDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donations, setDonations] = useState([]);
  const [sponsoredStudents, setSponsoredStudents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [feeSummary, setFeeSummary] = useState([]);
  const [showPayForm, setShowPayForm] = useState(false);
  const [payForm, setPayForm] = useState({ student_id: "", amount: "", payment_date: "", payment_method: "online", notes: "" });
  const [availableStudents, setAvailableStudents] = useState([]);
  const [showAdoptSection, setShowAdoptSection] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user session
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;
        if (!user) {
          navigate("/donor-login");
          return;
        }

        setDonorName(user.user_metadata?.name || user.email);
        const email = user.email;
        setDonorEmail(email);

        // Fetch donations, donor-mappings, notifications, and fee summary in parallel
        const [donationsRes, mappingsRes, notifsRes] = await Promise.all([
          supabase.from("donations").select("*").eq("donor_email", email),
          supabase.from("donor_mapping").select("*").eq("donor_email", email),
          supabase.from("notifications").select("*").eq("recipient_email", email),
        ]);

        if (donationsRes.data) setDonations(donationsRes.data);
        if (mappingsRes.data) setSponsoredStudents(mappingsRes.data);
        if (notifsRes.data) setNotifications(notifsRes.data);

        // Fetch fee summary and available students for adoption
        try {
          const axios = (await import("axios")).default;
          const [summaryResp, availableResp] = await Promise.all([
            axios.get("/api/fee-payments/summary"),
            axios.get("/api/students/available-for-adoption"),
          ]);
          if (summaryResp?.data?.data) setFeeSummary(summaryResp.data.data);
          if (availableResp?.data?.data) setAvailableStudents(availableResp.data.data);
        } catch (e) {
          console.error("Fee summary / available students error:", e);
        }
      } catch (err) {
        console.error("Error loading donor dashboard:", err);
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

  const handlePayDonation = async () => {
    if (!payForm.amount) { alert("Amount is required."); return; }
    try {
      const { error } = await supabase.from("donations").insert({
        donor_name: donorName,
        donor_email: donorEmail,
        student_id: payForm.student_id ? parseInt(payForm.student_id) : null,
        amount: parseFloat(payForm.amount),
        payment_date: payForm.payment_date || new Date().toISOString().split("T")[0],
        payment_method: payForm.payment_method,
        notes: payForm.notes || null,
      });
      if (error) { alert("Error: " + error.message); return; }
      alert("Donation recorded successfully!");
      setShowPayForm(false);
      setPayForm({ student_id: "", amount: "", payment_date: "", payment_method: "online", notes: "" });
      // Refresh donations
      const { data: refreshed } = await supabase.from("donations").select("*").eq("donor_email", donorEmail);
      if (refreshed) setDonations(refreshed);
    } catch (err) {
      alert("Error recording donation.");
    }
  };

  const handleAdoptStudent = async (studentId, studentName) => {
    if (!window.confirm(`Adopt ${studentName}? This will create a sponsorship mapping.`)) return;
    try {
      const { error } = await supabase.from("donor_mapping").insert({
        student_id: studentId,
        donor_name: donorName,
        donor_email: donorEmail,
        year_of_support: new Date().getFullYear().toString(),
        amount: 0,
        is_current_sponsor: 1,
      });
      if (error) { alert("Error: " + error.message); return; }
      alert(`You are now sponsoring ${studentName}!`);
      // Refresh mappings and available students
      const [mappingsRes] = await Promise.all([
        supabase.from("donor_mapping").select("*").eq("donor_email", donorEmail),
      ]);
      if (mappingsRes.data) setSponsoredStudents(mappingsRes.data);
      setAvailableStudents(prev => prev.filter(s => s.id !== studentId));
    } catch (err) {
      alert("Error adopting student.");
    }
  };

  // Calculate metrics from real data
  const totalDonated = donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
  const studentsSponsored = sponsoredStudents.filter((s) => s.is_current_sponsor).length;
  const totalDonationCount = donations.length;

  const metrics = [
    { title: "Total Donated", value: totalDonated, change: `${totalDonationCount} donations`, color: "green" },
    { title: "Students Sponsored", value: studentsSponsored, change: `${sponsoredStudents.length} total mappings`, color: "blue" },
    { title: "Notifications", value: notifications.filter((n) => !n.is_read).length, change: `${notifications.length} total`, color: "orange" },
  ];

  // Donation overview from real data
  const currentYearDonations = donations.filter(
    (d) => d.payment_date && d.payment_date.startsWith(new Date().getFullYear().toString())
  );
  const overviewItems = [
    { title: "Total Donations (All Time)", value: totalDonated, isCurrency: true },
    { title: "This Year", value: currentYearDonations.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0), isCurrency: true },
    { title: "Students Supported", value: sponsoredStudents.length, isCurrency: false },
    { title: "Total Transactions", value: donations.length, isCurrency: false },
  ];

  // Financial progress (this year vs a reasonable goal)
  const thisYearTotal = currentYearDonations.reduce((s, d) => s + (parseFloat(d.amount) || 0), 0);
  const annualGoal = Math.max(thisYearTotal, 100000); // at least 1L or actual donations
  const percentage = annualGoal > 0 ? Math.min(100, Math.round((thisYearTotal / annualGoal) * 100)) : 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  if (loading) {
    return (
      <div className="app-container">
        <p style={{ padding: "2rem", textAlign: "center" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="dashboard-layout">
        <Sidebar onLogout={handleLogout} />
        <main className="main-content">
          <header className="main-header">
            <h1 className="page-title">Donor Impact Dashboard</h1>
            <div className="user-info">
              <span className="user-name">{donorName}</span>
              <div className="user-avatar"></div>
            </div>
          </header>

          <div className="metrics-grid">
            {metrics.map((item, i) => (
              <MetricCard
                key={i}
                title={item.title}
                value={item.value}
                change={item.change}
                color={item.color}
              />
            ))}
          </div>

          <div className="bottom-grid">
            {/* Donation Overview */}
            <div className="dashboard-card overview-list">
              <div className="card-header-flex">
                <h2 className="card-header-title">Donation Overview</h2>
                <a href="#" className="view-link">
                  All Time <ChevronDown size={14} style={{ marginLeft: "4px" }} />
                </a>
              </div>
              <div className="overview-items">
                {overviewItems.map((item, index) => (
                  <div key={index} className="overview-item">
                    <span className="overview-item-title">{item.title}</span>
                    <span className="overview-item-value">
                      {item.isCurrency
                        ? `₹${(item.value || 0).toLocaleString()}`
                        : (item.value || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Annual Donation Progress */}
            <div className="dashboard-card total-sale-chart">
              <div className="card-header-flex">
                <h2 className="card-header-title">Annual Donation Progress</h2>
                <a href="#" className="view-link-green">View Progress</a>
              </div>
              <div className="chart-container">
                <svg viewBox="0 0 140 140" className="chart-svg">
                  <circle cx="70" cy="70" r={radius} fill="transparent" stroke="#f0f0f0" strokeWidth="16" />
                  <circle
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke="#10b981"
                    strokeWidth="16"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transform: "rotate(-90deg)", transformOrigin: "70px 70px" }}
                  />
                </svg>
                <div className="chart-percentage">
                  <span className="percentage-value">{percentage}%</span>
                </div>
              </div>
              <p className="chart-info">
                ₹{thisYearTotal.toLocaleString()} donated this year
              </p>
            </div>

            {/* Sponsored Students Table */}
            <div className="dashboard-card student-table">
              <div className="card-header-flex">
                <h2 className="card-header-title">Your Sponsored Students</h2>
                <span className="view-link-green">{sponsoredStudents.length} students</span>
              </div>
              {sponsoredStudents.length === 0 ? (
                <p style={{ color: "#888", padding: "1rem" }}>No student sponsorships yet.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Year of Support</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sponsoredStudents.map((mapping) => (
                      <tr key={mapping.id}>
                        <td>{mapping.student_name || `Student #${mapping.student_id}`}</td>
                        <td>{mapping.year_of_support || "N/A"}</td>
                        <td>₹{(parseFloat(mapping.amount) || 0).toLocaleString()}</td>
                        <td>
                          <span style={{
                            color: mapping.is_current_sponsor ? "#10b981" : "#888",
                            fontWeight: 600,
                          }}>
                            {mapping.is_current_sponsor ? "Active" : "Past"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pay Donation */}
            <div className="dashboard-card overview-list">
              <div className="card-header-flex">
                <h2 className="card-header-title">Pay Donation</h2>
                <button className="view-link-green" style={{ cursor: "pointer", border: "none", background: "none", fontWeight: 600 }} onClick={() => setShowPayForm(!showPayForm)}>
                  {showPayForm ? "Cancel" : "+ New Donation"}
                </button>
              </div>
              {showPayForm && (
                <div style={{ padding: "1rem 0" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <label style={{ fontSize: "0.85em" }}>For Student (optional)
                      <select value={payForm.student_id} onChange={(e) => setPayForm(f => ({ ...f, student_id: e.target.value }))} style={{ width: "100%", padding: "6px" }}>
                        <option value="">General Donation</option>
                        {sponsoredStudents.map(s => <option key={s.id} value={s.student_id}>{s.student_name || `#${s.student_id}`}</option>)}
                      </select>
                    </label>
                    <label style={{ fontSize: "0.85em" }}>Amount (₹) *
                      <input type="number" value={payForm.amount} onChange={(e) => setPayForm(f => ({ ...f, amount: e.target.value }))} style={{ width: "100%", padding: "6px" }} />
                    </label>
                    <label style={{ fontSize: "0.85em" }}>Date
                      <input type="date" value={payForm.payment_date} onChange={(e) => setPayForm(f => ({ ...f, payment_date: e.target.value }))} style={{ width: "100%", padding: "6px" }} />
                    </label>
                    <label style={{ fontSize: "0.85em" }}>Method
                      <select value={payForm.payment_method} onChange={(e) => setPayForm(f => ({ ...f, payment_method: e.target.value }))} style={{ width: "100%", padding: "6px" }}>
                        <option value="online">Online</option>
                        <option value="upi">UPI</option>
                        <option value="cash">Cash</option>
                        <option value="cheque">Cheque</option>
                      </select>
                    </label>
                  </div>
                  <button onClick={handlePayDonation} style={{ marginTop: "12px", padding: "8px 20px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}>
                    Submit Donation
                  </button>
                </div>
              )}
              {donations.length > 0 && !showPayForm && (
                <div className="overview-items">
                  {donations.slice(0, 5).map((d, i) => (
                    <div key={i} className="overview-item">
                      <span className="overview-item-title">{d.payment_date} — {d.payment_method}</span>
                      <span className="overview-item-value">₹{(parseFloat(d.amount) || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Adopted Child Progress */}
            {sponsoredStudents.length > 0 && feeSummary.length > 0 && (
              <div className="dashboard-card student-table">
                <div className="card-header-flex">
                  <h2 className="card-header-title">Child Progress & Fee Status</h2>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Total Fee</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Fee Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sponsoredStudents.filter(s => s.is_current_sponsor).map(mapping => {
                      const feeInfo = feeSummary.find(fs => fs.student_id === mapping.student_id) || {};
                      return (
                        <tr key={mapping.id}>
                          <td>{mapping.student_name || `#${mapping.student_id}`}</td>
                          <td>₹{(feeInfo.total_fee || 0).toLocaleString()}</td>
                          <td>₹{(feeInfo.total_paid || 0).toLocaleString()}</td>
                          <td>₹{(feeInfo.balance || 0).toLocaleString()}</td>
                          <td>
                            <span style={{ color: feeInfo.status === "paid" ? "#10b981" : feeInfo.status === "partial" ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>
                              {feeInfo.status === "paid" ? "Paid" : feeInfo.status === "partial" ? "Partial" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Adopt a Child */}
            <div className="dashboard-card student-table">
              <div className="card-header-flex">
                <h2 className="card-header-title">Adopt a Child</h2>
                <button className="view-link-green" style={{ cursor: "pointer", border: "none", background: "none", fontWeight: 600 }} onClick={() => setShowAdoptSection(!showAdoptSection)}>
                  {showAdoptSection ? "Hide" : `${availableStudents.length} Available`}
                </button>
              </div>
              {showAdoptSection && (
                availableStudents.length === 0 ? (
                  <p style={{ color: "#888", padding: "1rem" }}>All students are currently sponsored.</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Program</th>
                        <th>Year</th>
                        <th>School</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableStudents.map(s => (
                        <tr key={s.id}>
                          <td>{`${s.first_name || ""} ${s.last_name || ""}`.trim() || `#${s.id}`}</td>
                          <td>{s.educationcategory || "N/A"}</td>
                          <td>{s.educationyear || "N/A"}</td>
                          <td>{s.school || "N/A"}</td>
                          <td>
                            <button
                              onClick={() => handleAdoptStudent(s.id, `${s.first_name || ""} ${s.last_name || ""}`.trim())}
                              style={{ padding: "4px 12px", background: "#10b981", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 600, fontSize: "0.85em" }}
                            >
                              Adopt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              )}
            </div>

            {/* Recent Notifications */}
            <div className="dashboard-card activity-feed">
              <div className="card-header-flex">
                <h2 className="card-header-title">Recent Updates</h2>
                <span className="view-link-green">
                  {notifications.filter((n) => !n.is_read).length} unread
                </span>
              </div>
              {notifications.length === 0 ? (
                <p style={{ color: "#888", padding: "1rem" }}>No updates yet.</p>
              ) : (
                notifications.slice(0, 5).map((notif) => (
                  <div key={notif.id} className="activity-item" style={{ opacity: notif.is_read ? 0.6 : 1 }}>
                    <span className={`activity-dot dot-${notif.priority === "high" ? "red" : notif.priority === "medium" ? "orange" : "blue"}`}></span>
                    <p className="activity-text">{notif.title}{notif.message ? ` — ${notif.message}` : ""}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DonorDashboard;
