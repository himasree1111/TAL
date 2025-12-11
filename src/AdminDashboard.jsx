import React, { useMemo, useState, useEffect } from "react";
import "./AdminDashboard.css";
import supabase from "./supabaseClient";

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [donors, setDonors] = useState([]);
  const [viewDonor, setViewDonor] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch student form submissions
        const { data: studentData, error: studentError } = await supabase
          .from('student_form_submissions')
          .select('*')
          .order('created_at', { ascending: false });
        // Save raw fetch result for debugging
        setLastFetch({ data: studentData || null, error: studentError || null, fetchedAt: new Date().toISOString() });

        if (studentError) {
          console.error('AdminDashboard: Error fetching student data:', studentError);
        } else {
          console.log('AdminDashboard: fetched studentData (count):', Array.isArray(studentData) ? studentData.length : 0);
          // Transform student data to match admin dashboard format
          const transformedStudents = (studentData || []).map((student, index) => ({
            id: student.id || index + 1,
            name: `${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''}`.trim(),
            college: student.school || '',
            year: student.class || '',
            donor: student.volunteer_email || 'None', // Use volunteer email as donor for now
            feeStatus: student.fee ? 'Paid' : 'Pending', // Simple logic based on fee field
            campName: student.camp_name || '',
            campDate: student.created_at ? new Date(student.created_at).toISOString().split('T')[0] : '',
            course: student.educationcategory || '',
            paidDate: student.fee ? new Date(student.created_at).toISOString().split('T')[0] : ''
          }));
          setStudents(transformedStudents);
        }

        // For now, create dummy donors from volunteer emails (you can replace this with real donor data later)
        const uniqueVolunteers = [...new Set((studentData || []).map(s => s.volunteer_email).filter(Boolean))];
        const transformedDonors = uniqueVolunteers.map((email, index) => ({
          id: index + 1,
          name: email,
          amount: Math.floor(Math.random() * 10000) + 5000, // Random amount for demo
          years: "2024-2025"
        }));
        setDonors(transformedDonors);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // filters now include stream (course)
  const [filters, setFilters] = useState({ class: "", donor: "", feeStatus: "", stream: "" });
  const [query, setQuery] = useState("");

  const [activeSection, setActiveSection] = useState("overview");

  // modal state
  const [viewStudent, setViewStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);

  const totals = useMemo(() => {
    const totalStudents = students.length;
    const feesCollected = donors.reduce((s, d) => s + d.amount, 0);
    const pendingFees = students.filter((s) => s.feeStatus === "Pending").length;
    const activeDonors = donors.length;
    return { totalStudents, feesCollected, pendingFees, activeDonors };
  }, [students, donors]);

  // filteredStudents takes stream/course into account
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (filters.class && s.year !== filters.class) return false;
      if (filters.donor) {
        // When "None" is selected, show students with donor "None"
        if (filters.donor === "None") {
          if (s.donor !== "None") return false;
        } else {
          if (s.donor !== filters.donor) return false;
        }
      }
      if (filters.feeStatus && s.feeStatus !== filters.feeStatus) return false;
      if (filters.stream && s.course !== filters.stream) return false;
      if (query && !`${s.name} ${s.college}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [students, filters, query]);

  // helpers
  const uniqueCourses = useMemo(() => {
    const set = new Set();
    students.forEach(s => s.course && set.add(s.course));
    return Array.from(set);
  }, [students]);

  const handleDelete = (id) => {
    if (!window.confirm("Delete this student record?")) return;
    setStudents((prev) => prev.filter((p) => p.id !== id));
  };

  const handleEditSave = (data) => {
    // Data contains id + updated fields
    setStudents((prev) => prev.map((p) => (p.id === data.id ? { ...p, ...data } : p)));
    setEditStudent(null);
  };

  const exportCSV = () => {
    // include new fields campName,campDate,course,paidDate
    const rows = [
      "id,name,college,year,donor,feeStatus,course,campName,campDate,paidDate",
      ...students.map(s => `${s.id},"${s.name}","${s.college}",${s.year},${s.donor},${s.feeStatus},${s.course || ""},"${s.campName || ""}",${s.campDate || ""},${s.paidDate || ""}`)
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- New handlers for interactive buttons ---
  const handleAddDonor = () => {
    const name = window.prompt('Donor name');
    if (!name) return;
    const amount = window.prompt('Amount (number)');
    if (!amount) return;
    const newDonor = { id: Date.now(), name, amount: Number(amount), years: '2025-2026' };
    setDonors((d) => [...d, newDonor]);
    alert('Donor added (demo)');
  };

  const handleExportDonorReport = () => {
    const rows = ['id,name,amount,years', ...donors.map(d => `${d.id},${d.name},${d.amount},${d.years}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'donors.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleContactDonor = (donor) => {
    const email = window.prompt('Enter email to contact ' + donor.name, 'donor@example.org');
    if (!email) return;
    window.location.href = `mailto:${email}?subject=Regarding%20support`;
  };

  const handleSendReminders = () => {
    alert('Reminders sent (demo)');
  };

  const handleDownloadFeeReport = () => {
    const rows = ['id,name,total,paid,balance,paidDate', ...students.map(s => {
      const total = 5000;
      const paid = s.feeStatus === 'Paid' ? 5000 : s.feeStatus === 'Partial' ? 2500 : 0;
      const balance = total - paid;
      return `${s.id},"${s.name}",${total},${paid},${balance},${s.paidDate || ""}`;
    })];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fee-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleViewHistory = (studentId) => {
    const s = students.find(x => x.id === studentId);
    alert(`Payment history (demo) for ${s?.name || studentId}`);
  };

  const handleRecordPayment = (studentId) => {
    const today = new Date();
    const iso = today.toISOString().split('T')[0]; // YYYY-MM-DD
    setStudents(prev => prev.map(p => p.id === studentId ? { ...p, feeStatus: 'Paid', paidDate: iso } : p));
    alert('Marked as Paid (demo)');
  };

  const handleCreateBroadcastType = (type) => {
    alert(type + ' template opened (demo)');
  };

  const handleGenerateReport = () => {
    alert('Custom report generated (demo)');
  };

  const handleDownloadSpecificReport = (key) => {
    const blob = new Blob([key + ' report (demo)'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${key}-report.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveSettings = () => {
    alert('Settings saved (demo)');
  };

  // When opening edit modal, create a shallow copy so editing doesn't mutate state directly
  const openEditModal = (s) => {
    setEditStudent({ ...s });
  };

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <div className="sidebar-top">
          <div className="brand">Touch A Life - Admin</div>
          <nav>
            <ul>
              <li className={activeSection === "overview" ? "active" : ""} onClick={() => setActiveSection("overview")}>Dashboard Overview</li>
              <li className={activeSection === "manage" ? "active" : ""} onClick={() => setActiveSection("manage")}>Manage Beneficiaries</li>
              <li className={activeSection === "mapping" ? "active" : ""} onClick={() => setActiveSection("mapping")}>Donor Mapping</li>
              <li className={activeSection === "fees" ? "active" : ""} onClick={() => setActiveSection("fees")}>Fee Tracking</li>
              <li className={activeSection === "broadcast" ? "active" : ""} onClick={() => setActiveSection("broadcast")}>Alerts & Broadcast</li>
              <li className={activeSection === "reports" ? "active" : ""} onClick={() => setActiveSection("reports")}>Reports & Exports</li>
              <li className={activeSection === "settings" ? "active" : ""} onClick={() => setActiveSection("settings")}>Settings</li>
            </ul>
          </nav>
        </div>
        <button className="logout-btn" onClick={() => window.location.href = '/'}>Logout</button>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <h2>{activeSection === "overview" ? "Dashboard Overview" : activeSection === "manage" ? "Manage Beneficiaries" : activeSection === "mapping" ? "Donor Mapping" : activeSection === "fees" ? "Fee Tracking" : activeSection === "broadcast" ? "Alerts & Broadcast" : activeSection === "reports" ? "Reports & Exports" : "Settings"}</h2>
          <div className="header-actions">
            <input placeholder="Search students or college..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <button className="btn primary" onClick={() => setBroadcastOpen(true)}>New Broadcast</button>
          </div>
        </header>

        <main className="admin-content">
          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div>Loading data...</div>
            </div>
          )}

          {!loading && activeSection === "overview" && (
            <>
              {/* Overview cards */}
              <section className="cards-row">
                <div className="card">
                  <div className="card-icon student-icon">👥</div>
                  <div className="card-content">
                    <div className="card-title">Total Students</div>
                    <div className="card-value">{totals.totalStudents}</div>
                    <div className="card-trend positive">↑ 12% from last month</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-icon money-icon">💰</div>
                  <div className="card-content">
                    <div className="card-title">Fees Collected</div>
                    <div className="card-value">₹{totals.feesCollected}</div>
                    <div className="card-trend positive">↑ 8% from last month</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-icon pending-icon">⏳</div>
                  <div className="card-content">
                    <div className="card-title">Pending Fees</div>
                    <div className="card-value">{totals.pendingFees}</div>
                    <div className="card-trend negative">↑ 2% from last month</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-icon donor-icon">🤝</div>
                  <div className="card-content">
                    <div className="card-title">Active Donors</div>
                    <div className="card-value">{totals.activeDonors}</div>
                    <div className="card-trend positive">↑ 5% from last month</div>
                  </div>
                </div>
              </section>
              
              {/* Quick Stats Section */}
              <section className="quick-stats">
                <div className="stat-card">
                  <h3>Recent Activity</h3>
                  <div className="activity-list">
                    <div className="activity-item">
                      <span className="activity-dot green"></span>
                      <div className="activity-content">
                        <div className="activity-text">New student registered</div>
                        <div className="activity-time">2 hours ago</div>
                      </div>
                    </div>
                    <div className="activity-item">
                      <span className="activity-dot blue"></span>
                      <div className="activity-content">
                        <div className="activity-text">Fees collected from 3 students</div>
                        <div className="activity-time">5 hours ago</div>
                      </div>
                    </div>
                    <div className="activity-item">
                      <span className="activity-dot orange"></span>
                      <div className="activity-content">
                        <div className="activity-text">New donor joined</div>
                        <div className="activity-time">1 day ago</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <h3>Fee Status Distribution</h3>
                  <div className="status-grid">
                    <div className="status-item">
                      <div className="status-label">Paid</div>
                      <div className="status-bar">
                        <div className="status-fill green" style={{width: '65%'}}></div>
                      </div>
                      <div className="status-value">65%</div>
                    </div>
                    <div className="status-item">
                      <div className="status-label">Partial</div>
                      <div className="status-bar">
                        <div className="status-fill orange" style={{width: '20%'}}></div>
                      </div>
                      <div className="status-value">20%</div>
                    </div>
                    <div className="status-item">
                      <div className="status-label">Pending</div>
                      <div className="status-bar">
                        <div className="status-fill red" style={{width: '15%'}}></div>
                      </div>
                      <div className="status-value">15%</div>
                    </div>
                  </div>
                </div>
                
                <div className="stat-card">
                  <h3>Upcoming Deadlines</h3>
                  <div className="deadline-list">
                    <div className="deadline-item">
                      <div className="deadline-date">Nov 15</div>
                      <div className="deadline-content">
                        <div>Fee submission deadline</div>
                        <div className="deadline-count">8 students pending</div>
                      </div>
                    </div>
                    <div className="deadline-item">
                      <div className="deadline-date">Nov 20</div>
                      <div className="deadline-content">
                        <div>Document verification</div>
                        <div className="deadline-count">12 students pending</div>
                      </div>
                    </div>
                    <div className="deadline-item">
                      <div className="deadline-date">Nov 30</div>
                      <div className="deadline-content">
                        <div>Progress report submission</div>
                        <div className="deadline-count">15 reports due</div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Manage Beneficiaries */}
          {activeSection === "manage" && (
            <section className="manage-section">
              <div className="manage-controls">
                <div className="filters">
                  <select value={filters.class} onChange={(e) => setFilters(f => ({...f, class: e.target.value}))}>
                    <option value="">All Years</option>
                    <option>1st</option>
                    <option>2nd</option>
                    <option>3rd</option>
                    <option>4th</option>
                  </select>

                  <select value={filters.donor} onChange={(e) => setFilters(f => ({...f, donor: e.target.value}))}>
                    <option value="">All Donors</option>
                    <option>None</option>
                    {donors.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>

                  <select value={filters.feeStatus} onChange={(e) => setFilters(f => ({...f, feeStatus: e.target.value}))}>
                    <option value="">All Fee Status</option>
                    <option>Paid</option>
                    <option>Partial</option>
                    <option>Pending</option>
                  </select>

                  {/* NEW: Stream / Course filter */}
                  <select value={filters.stream} onChange={(e) => setFilters(f => ({...f, stream: e.target.value}))}>
                    <option value="">All Streams</option>
                    {uniqueCourses.map((c, idx) => <option key={idx} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="manage-actions">
                  <button className="btn" onClick={exportCSV}>Export CSV</button>
                </div>
              </div>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>College</th>
                      <th>Year</th>
                      <th>Donor</th>
                      <th>Fee Status</th>
                      <th>Course</th>         {/* NEW column (stream) */}
                      <th>Camp</th>           {/* NEW column (campName / campDate) */}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(s => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.college}</td>
                        <td>{s.year}</td>
                        <td>{s.donor}</td>
                        <td>{s.feeStatus}</td>
                        <td>{s.course}</td>
                        <td>
                          <div style={{whiteSpace: 'nowrap'}}>
                            <div>{s.campName}</div>
                            <div style={{fontSize: '0.85em', color: '#666'}}>{s.campDate}</div>
                          </div>
                        </td>
                        <td>
                          <button className="btn small icon-btn" onClick={() => setViewStudent(s)} title="View Profile">👁️</button>
                          <button className="btn small icon-btn" onClick={() => openEditModal(s)} title="Edit">✏️</button>
                          <button className="btn small danger icon-btn" onClick={() => handleDelete(s.id)} title="Delete">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Debug panel: show raw fetch when no students present to help diagnose Supabase issues */}
              {students.length === 0 && lastFetch && (
                <div className="debug-panel">
                  <h4>Debug: Supabase Fetch Result</h4>
                  <div style={{whiteSpace: 'pre-wrap', fontSize: '0.85rem', background: '#111', color: '#e6fffd', padding: 12, borderRadius: 6, marginTop: 12}}>
                    {JSON.stringify(lastFetch, null, 2)}
                  </div>
                  <div style={{marginTop:8, fontSize:'0.9rem'}}>
                    If this shows an empty array, check the table name and whether rows exist in Supabase.
                    If an error is present, check RLS permissions and your anon key in `src/supabaseClient.js`.
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Donor Mapping */}
          {activeSection === "mapping" && (
            <section className="mapping-section">
              <div className="section-header">
                <h3>Donor Mapping</h3>
                <div className="section-actions">
                  <button className="btn primary" onClick={handleAddDonor}>Add New Donor</button>
                  <button className="btn" onClick={handleExportDonorReport}>Export Report</button>
                </div>
              </div>

              <div className="mapping-stats">
                <div className="stat-box">
                  <div className="value">₹{donors.reduce((s,d) => s + d.amount, 0)}</div>
                  <div className="label">Total Funds Available</div>
                </div>
                <div className="stat-box">
                  <div className="value">{students.length}</div>
                  <div className="label">Students Supported</div>
                </div>
                <div className="stat-box">
                  <div className="value">85%</div>
                  <div className="label">Fund Utilization</div>
                </div>
              </div>

              <div className="mapping-grid">
                {donors.map(d => (
                  <div key={d.id} className="map-card">
                    <div className="map-name">{d.name}</div>
                    <div className="map-stats">
                      <div className="map-stat">
                        <div className="label">Total Amount</div>
                        <div className="value">₹{d.amount}</div>
                      </div>
                      <div className="map-stat">
                        <div className="label">Duration</div>
                        <div className="value">{d.years}</div>
                      </div>
                      <div className="map-stat">
                        <div className="label">Students</div>
                        <div className="value">{Math.floor(Math.random() * 5) + 1}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <button className="btn small" onClick={() => setViewDonor(d)}>View Details</button>
                      <button className="btn small" style={{ marginLeft: '8px' }} onClick={() => handleContactDonor(d)}>Contact</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Fee Tracking */}
          {activeSection === "fees" && (
            <section className="fees-section">
              <div className="section-header">
                <h3>Fee Tracking</h3>
                <div className="section-actions">
                  <button className="btn primary" onClick={handleSendReminders}>Send Reminders</button>
                  <button className="btn" onClick={handleDownloadFeeReport}>Download Report</button>
                </div>
              </div>

              <div className="fee-summary">
                <div className="fee-card">
                  <div className="amount">₹{donors.reduce((s,d) => s + d.amount, 0)}</div>
                  <div className="label">Total Fees</div>
                </div>
                <div className="fee-card">
                  <div className="amount">₹18000</div>
                  <div className="label">Collected</div>
                </div>
                <div className="fee-card">
                  <div className="amount">₹7000</div>
                  <div className="label">Pending</div>
                </div>
                <div className="fee-card">
                  <div className="amount">72%</div>
                  <div className="label">Collection Rate</div>
                </div>
              </div>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Total Fee</th>
                      <th>Paid Amount</th>
                      <th>Due Date</th>
                      <th>Paid Date</th> {/* NEW */}
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>₹5,000</td>
                        <td>₹{s.feeStatus === 'Paid' ? '5,000' : s.feeStatus === 'Partial' ? '2,500' : '0'}</td>
                        <td>Nov 30, 2025</td>
                        <td>{s.paidDate ? s.paidDate : "-"}</td> {/* show paidDate */}
                        <td>
                          <span className={`status-badge ${s.feeStatus.toLowerCase()}`}>
                            {s.feeStatus}
                          </span>
                        </td>
                        <td>
                          <button className="btn small" onClick={() => handleViewHistory(s.id)}>View History</button>
                          <button className="btn small primary" style={{marginLeft: '8px'}} onClick={() => handleRecordPayment(s.id)}>Record Payment</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Broadcast */}
          {activeSection === "broadcast" && (
            <section className="broadcast-section">
              <div className="section-header">
                <h3>Alerts & Broadcasts</h3>
                <div className="section-actions">
                  <button className="btn primary" onClick={() => setBroadcastOpen(true)}>New Broadcast</button>
                </div>
              </div>

              <div className="broadcast-types">
                <div className="broadcast-card">
                  <h4>Fee Reminders</h4>
                  <p>Send automated reminders for fee payments</p>
                  <button className="btn" onClick={() => handleCreateBroadcastType('Fee Reminder')}>Create Reminder</button>
                </div>
                <div className="broadcast-card">
                  <h4>Event Announcements</h4>
                  <p>Broadcast upcoming events and activities</p>
                  <button className="btn" onClick={() => handleCreateBroadcastType('Announcement')}>Create Announcement</button>
                </div>
                <div className="broadcast-card">
                  <h4>Document Requests</h4>
                  <p>Request necessary documents from students</p>
                  <button className="btn" onClick={() => handleCreateBroadcastType('Document Request')}>Create Request</button>
                </div>
              </div>

              <div className="broadcast-history">
                <h4>Recent Broadcasts</h4>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Message</th>
                        <th>Recipients</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Nov 1, 2025</td>
                        <td>Fee Reminder</td>
                        <td>November fee payment reminder</td>
                        <td>15 students</td>
                        <td>Sent</td>
                      </tr>
                      <tr>
                        <td>Oct 28, 2025</td>
                        <td>Announcement</td>
                        <td>Quarterly progress review meeting</td>
                        <td>All students</td>
                        <td>Sent</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* Reports */}
          {activeSection === "reports" && (
            <section className="reports-section">
              <div className="section-header">
                <h3>Reports & Analytics</h3>
                <div className="section-actions">
                  <button className="btn" onClick={handleGenerateReport}>Generate Custom Report</button>
                </div>
              </div>

              <div className="reports-grid">
                <div className="report-card">
                  <h4>Financial Overview</h4>
                  <div className="chart-placeholder">Fund Utilization Chart</div>
                  <button className="btn small" onClick={() => handleDownloadSpecificReport('financial')}>Download Report</button>
                </div>
                <div className="report-card">
                  <h4>Student Performance</h4>
                  <div className="chart-placeholder">Performance Metrics</div>
                  <button className="btn small" onClick={() => handleDownloadSpecificReport('performance')}>Download Report</button>
                </div>
                <div className="report-card">
                  <h4>Donor Contributions</h4>
                  <div className="chart-placeholder">Contribution Analysis</div>
                  <button className="btn small" onClick={() => handleDownloadSpecificReport('donor')}>Download Report</button>
                </div>
              </div>
            </section>
          )}

          {/* Settings */}
          {activeSection === "settings" && (
            <section className="settings-section">
              <div className="section-header">
                <h3>System Settings</h3>
                <div className="section-actions">
                  <button className="btn primary" onClick={handleSaveSettings}>Save Changes</button>
                </div>
              </div>

              <div className="settings-grid">
                <div className="settings-card">
                  <h4>Profile Settings</h4>
                  <div className="settings-form">
                    <label>
                      Admin Name
                      <input type="text" className="form-input" defaultValue="Admin User" />
                    </label>
                    <label>
                      Email Address
                      <input type="email" className="form-input" defaultValue="admin@touchalife.org" />
                    </label>
                    <label>
                      Contact Number
                      <input type="tel" className="form-input" defaultValue="+91 98765 43210" />
                    </label>
                  </div>
                </div>
                
                <div className="settings-card">
                  <h4>Notification Preferences</h4>
                  <div className="settings-form">
                    <label className="checkbox-label">
                      <input type="checkbox" defaultChecked /> Email Notifications
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" defaultChecked /> SMS Alerts
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" defaultChecked /> System Notifications
                    </label>
                  </div>
                </div>

                <div className="settings-card">
                  <h4>System Preferences</h4>
                  <div className="settings-form">
                    <label>
                      Default Language
                      <select className="form-input">
                        <option>English</option>
                        <option>Hindi</option>
                      </select>
                    </label>
                    <label>
                      Time Zone
                      <select className="form-input">
                        <option>IST (UTC+5:30)</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* View / Edit modals */}
      {viewStudent && (
        <div className="modal-overlay" onClick={() => setViewStudent(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Student Profile</h3>
            <p><strong>Name:</strong> {viewStudent.name}</p>
            <p><strong>College:</strong> {viewStudent.college}</p>
            <p><strong>Year:</strong> {viewStudent.year}</p>
            <p><strong>Donor:</strong> {viewStudent.donor}</p>
            <p><strong>Course:</strong> {viewStudent.course}</p>
            <p><strong>Camp:</strong> {viewStudent.campName} ({viewStudent.campDate})</p>
            <p><strong>Fee Status:</strong> {viewStudent.feeStatus}</p>
            <p><strong>Paid Date:</strong> {viewStudent.paidDate || '-'}</p>
            <button className="btn" onClick={() => setViewStudent(null)}>Close</button>
          </div>
        </div>
      )}

      {viewDonor && (
        <div className="modal-overlay" onClick={() => setViewDonor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Donor Details</h3>
            <p><strong>Name:</strong> {viewDonor.name}</p>
            <p><strong>Amount:</strong> ₹{viewDonor.amount}</p>
            <p><strong>Duration:</strong> {viewDonor.years}</p>
            <div style={{display:'flex',gap:8,marginTop:12}}>
              <button className="btn" onClick={() => setViewDonor(null)}>Close</button>
              <button className="btn" onClick={() => handleContactDonor(viewDonor)}>Contact</button>
            </div>
          </div>
        </div>
      )}

      {editStudent && (
        <div className="modal-overlay" onClick={() => setEditStudent(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Student</h3>
            {/* Edit form includes new fields: course, campName, campDate, paidDate */}
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const updated = {
                id: editStudent.id,
                name: fd.get('name'),
                college: fd.get('college'),
                year: fd.get('year'),
                donor: fd.get('donor'),
                feeStatus: fd.get('feeStatus'),
                course: fd.get('course'),
                campName: fd.get('campName'),
                campDate: fd.get('campDate'),
                paidDate: fd.get('paidDate') || ""
              };
              handleEditSave(updated);
            }}>
              <label>Name<input name="name" defaultValue={editStudent.name} /></label>
              <label>College<input name="college" defaultValue={editStudent.college} /></label>
              <label>Year<input name="year" defaultValue={editStudent.year} /></label>
              <label>Donor<input name="donor" defaultValue={editStudent.donor} /></label>

              <label>Course
                <input name="course" defaultValue={editStudent.course || ""} placeholder="e.g. Science, Commerce" />
              </label>

              <label>Camp Name<input name="campName" defaultValue={editStudent.campName || ""} /></label>
              <label>Camp Date<input name="campDate" defaultValue={editStudent.campDate || ""} placeholder="YYYY-MM-DD" /></label>

              <label>Paid Date<input name="paidDate" defaultValue={editStudent.paidDate || ""} placeholder="YYYY-MM-DD" /></label>

              <label>Fee Status
                <select name="feeStatus" defaultValue={editStudent.feeStatus}>
                  <option>Paid</option>
                  <option>Partial</option>
                  <option>Pending</option>
                </select>
              </label>

              <div style={{display:'flex',gap:8,marginTop:12}}>
                <button className="btn" type="submit">Save</button>
                <button className="btn" type="button" onClick={() => setEditStudent(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {broadcastOpen && (
        <div className="modal-overlay" onClick={() => setBroadcastOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create Broadcast</h3>
            <form onSubmit={(e) => { e.preventDefault(); alert('Broadcast sent (dummy)'); setBroadcastOpen(false); }}>
              <label>Message<textarea name="msg" rows={4} /></label>
              <label>Recipients<select name="rec">
                <option value="all">All Students</option>
                <option value="filtered">Filtered Students</option>
              </select></label>
              <div style={{display:'flex',gap:8,marginTop:12}}>
                <button className="btn primary" type="submit">Send</button>
                <button className="btn" type="button" onClick={() => setBroadcastOpen(false)}>Close</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
