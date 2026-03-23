import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { useDonor } from "./DonorContext";

import "./DonorDashboard.css";
import supabase from "./supabaseClient";

export default function DonorDashboard() {
  const navigate = useNavigate();
  const [donor, setDonor] = useState(null);
  const [contextLoading, setContextLoading] = useState(false);

  const [donations, setDonations] = useState([]);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!donor || contextLoading) {
      if (!contextLoading && !donor) {
        navigate("/coverpage");
      }
      return;
    }

    // Fetch donations for this donor
    fetchDonations();
  }, [donor, contextLoading, navigate]);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      // Query donations for this donor (adjust table/endpoint as needed)
      const { data, error } = await supabase
        .from('donations') // Assume donations table exists
        .select('*')
        .eq('donor_email', donor.email)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching donations:", error);
        setDonations([]);
      } else {
        setDonations(data || []);
      }
    } catch (err) {
      console.error('Donations fetch error:', err);
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/coverpage");
  };

  const thisMonthDonations = donations.filter(
    (d) => new Date(d.created_at).getMonth() === new Date().getMonth()
  ).length;

  const totalDonated = donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

  if (loading || contextLoading) {
    return <div className="donor-dashboard">
      <aside className="sidebar"><div>Loading...</div></aside>
      <main className="main-content"><div>Loading donor dashboard...</div></main>
    </div>;
  }

  return (
    <div className="donor-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="profile-section">
          <div className="profile-avatar">D</div>
          <h2 className="profile-name">{donor ? donor.name : 'Donor'}</h2>
          <p className="profile-email">{donor ? donor.email : ''}</p>
        </div>

        <div className="stats-grid">
          <div className="sidebar-item">
            <h3>{thisMonthDonations}</h3>
            <p>This Month</p>
          </div>
          <div className="sidebar-item">
            <h3>{totalDonated.toLocaleString()}</h3>
            <p>Total Donated</p>
          </div>
          <div className="sidebar-item" style={{gridColumn: 'span 2'}}>
            <h3>{donations.length}</h3>
            <p>Total Donations</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-btn ${activeSection === "dashboard" ? "active" : ""}`} 
            onClick={() => setActiveSection("dashboard")}
          >
            Dashboard
          </button>
          <button 
            className={`nav-btn ${activeSection === "donations" ? "active" : ""}`} 
            onClick={() => setActiveSection("donations")}
          >
            Donations
          </button>
          <button 
            className={`nav-btn ${activeSection === "students" ? "active" : ""}`} 
            onClick={() => setActiveSection("students")}
          >
            Students
          </button>
          <button 
            className={`nav-btn ${activeSection === "settings" ? "active" : ""}`} 
            onClick={() => setActiveSection("settings")}
          >
            Settings
          </button>
        </nav>

        <button className="logout-btn sidebar-item" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {activeSection === "dashboard" && (
          <>
            <div className="main-header">
              <h1>Donor Dashboard</h1>
              <button className="btn primary" onClick={() => setActiveSection("donations")}>
                New Donation
              </button>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="card-content">
                  <p>Total Donated</p>
                  <h2>₹{totalDonated.toLocaleString()}</h2>
                  <p className="card-change">This Year</p>
                </div>
              </div>
              <div className="metric-card">
                <div className="card-content">
                  <p>Donations Made</p>
                  <h2>{donations.length}</h2>
                  <p className="card-change">All Time</p>
                </div>
              </div>
              <div className="metric-card">
                <div className="card-content">
                  <p>Active Students</p>
                  <h2>12</h2>
                  <p className="card-change">Sponsored</p>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <h2>Recent Donations</h2>
              {donations.slice(0,5).map((d, i) => (
                <div key={i} className="recent-donation">
                  <span>₹{parseFloat(d.amount).toLocaleString()}</span>
                  <span>{new Date(d.created_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {activeSection === "donations" && (
          <div className="table-wrapper">
            <div className="main-header">
              <h1>My Donations</h1>
              <button className="btn primary">Export CSV</button>
            </div>
            {loading ? (
              <div>Loading donations...</div>
            ) : (
              <table className="donations-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Campaign</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d, i) => (
                    <tr key={i}>
                      <td>{new Date(d.created_at).toLocaleDateString()}</td>
                      <td>₹{parseFloat(d.amount || 0).toLocaleString()}</td>
                      <td>{d.campaign || 'General'}</td>
                      <td><span className="status-paid">Paid</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeSection === "students" && (
          <div className="students-section">
            <h1>Sponsored Students</h1>
            <p>Students supported by your donations (coming soon)</p>
          </div>
        )}

        {activeSection === "settings" && (
          <div className="settings-panel">
            <h2>Donor Settings</h2>
            <p>Update your profile.</p>
            <div>Settings form coming soon...</div>
          </div>
        )}
      </main>
    </div>
  );
}

