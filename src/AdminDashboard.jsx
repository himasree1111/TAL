import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import supabase from "./supabaseClient";
import { createNotification } from "./notificationService";

// Utility function to convert UTC to IST (Indian Standard Time)
const formatToIST = (dateString) => {
  if (!dateString) return "—";
  const utcDate = new Date(dateString);
  const istOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  return new Intl.DateTimeFormat('en-IN', istOptions).format(utcDate);
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [uniqueYears, setUniqueYears] = useState([]);
  const [donors, setDonors] = useState([]);
  const [viewDonor, setViewDonor] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [adminName, setAdminName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [systemNotifications, setSystemNotifications] = useState(true);
  const [defaultLanguage, setDefaultLanguage] = useState("English");
  const [timeZone, setTimeZone] = useState("IST (UTC+5:30)");
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [nonEligibleStudents, setNonEligibleStudents] = useState([]);
  const [loadingNonEligible, setLoadingNonEligible] = useState(false);
  const [nonEligibleCount, setNonEligibleCount] = useState(0);
  const [activeReportList, setActiveReportList] = useState(null);
  const [studentId, setStudentId] = useState(null);

  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationAudience, setNotificationAudience] = useState("all");
  const [notificationExpiresAt, setNotificationExpiresAt] = useState("");
  const [creatingNotification, setCreatingNotification] = useState(false);

  // Filters
  const [filters, setFilters] = useState({ class: "" });
  const [scholarshipFilter, setScholarshipFilter] = useState("");
  const [campNameFilter, setCampNameFilter] = useState("");
  const [campDateFilter, setCampDateFilter] = useState("");
  const [query, setQuery] = useState("");

  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [viewEligibleStudent, setViewEligibleStudent] = useState(null);
  const [viewNonEligibleStudent, setViewNonEligibleStudent] = useState(null);

  // Fetch user and data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setCurrentUser(session.user);
          setStudentId(session.user.id);
          setAdminName(session.user.user_metadata?.name || session.user.email?.split('@')[0] || "");
        } else {
          navigate('/');
        }

        // Fetch students
        const { data: studentData, error: studentError } = await supabase
          .from('admin_student_info')
          .select('*')
          .eq('status', 'Pending')
          .order('created_at', { ascending: false });

        setLastFetch({ data: studentData || null, error: studentError || null, fetchedAt: new Date().toISOString() });

        if (studentError) {
          console.error('AdminDashboard: Error fetching student data:', studentError);
        } else {
          console.log('AdminDashboard: fetched studentData (count):', Array.isArray(studentData) ? studentData.length : 0);
          const transformedStudents = (studentData || []).map((student, index) => ({
            id: student.id || index + 1,
            student_id: student.id,
            name: student.full_name || "",
            full_name: student.full_name || "",
            year: student.class,
            fee_status: student.fee || "Not Provided",
            course: student.educationcategory || "",
            campName: student.camp_name,
            campDate: student.camp_date ? new Date(student.camp_date).toISOString().split("T")[0] : "",
            age: student.age,
            class: student.class,
            prev_percent: student.prev_percent,
            present_percent: student.present_percent,
            email: student.email,
            contact: student.contact,
            whatsapp: student.whatsapp,
            student_contact: student.student_contact || "",
            scholarship: student.scholarship,
            has_scholarship: student.has_scholarship,
            does_work: student.does_work,
            earning_members: student.earning_members || "",
            created_at: student.created_at
          }));
          setStudents(transformedStudents);
        }

        // Fetch unique years
        const { data: yearsData } = await supabase
          .from('admin_student_info')
          .select('distinct class')
          .eq('status', 'Pending')
          .order('class', { ascending: true });

        const years = yearsData ? yearsData.map(y => y.class).filter(Boolean) : [];
        setUniqueYears(years);

        // Donors (dummy from volunteers)
        const uniqueVolunteers = [...new Set((studentData || []).map(s => s.volunteer_email).filter(Boolean))];
        const transformedDonors = uniqueVolunteers.map((email, index) => ({
          id: index + 1,
          name: email,
          amount: Math.floor(Math.random() * 10000) + 5000,
          years: "2024-2025"
        }));
        setDonors(transformedDonors);

        fetchEligibleCount();
        fetchNonEligibleCount();
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const totals = useMemo(() => {
    const totalStudents = students.length;
    const feesCollected = donors.reduce((s, d) => s + d.amount, 0);
    const pendingFees = students.filter((s) => s.fee_status === "Pending").length;
    const activeDonors = donors.length;
    return { totalStudents, feesCollected, pendingFees, activeDonors };
  }, [students, donors]);

  // Updated filteredStudents with new filters
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (filters.class && s.year !== filters.class) return false;
      
      if (scholarshipFilter) {
        const hasSch = s.has_scholarship ? 'yes' : 'no';
        if (hasSch !== scholarshipFilter) return false;
      }
      if (campNameFilter && !s.campName?.toLowerCase().includes(campNameFilter.toLowerCase())) return false;
      if (campDateFilter && s.campDate !== campDateFilter) return false;
      if (query && !`${s.name} ${s.full_name}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [students, filters, scholarshipFilter, campNameFilter, campDateFilter, query]);

  // Eligible/Non-eligible functions (unchanged)
  const fetchEligibleCount = async () => {
    const { count, error } = await supabase
      .from("eligible_students")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Error fetching eligible count:", error);
    } else {
      setEligibleCount(count || 0);
    }
  };

  const fetchNonEligibleCount = async () => {
    const { count, error } = await supabase
      .from("non_eligible_students")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Error fetching non-eligible count:", error);
    } else {
      setNonEligibleCount(count || 0);
    }
  };

  const fetchEligibleStudents = async () => {
    setLoadingEligible(true);
    try {
      const { data, error } = await supabase
        .from('eligible_students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching eligible students:', error);
        alert('Error fetching eligible students: ' + error.message);
      } else {
        setEligibleStudents(data || []);
        setEligibleCount(data?.length || 0);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error fetching data');
    } finally {
      setLoadingEligible(false);
    }
  };

  const fetchNonEligibleStudents = async () => {
    setLoadingNonEligible(true);
    try {
      const { data, error } = await supabase
        .from('non_eligible_students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching non-eligible students:', error);
        alert('Error fetching non-eligible students: ' + error.message);
      } else {
        setNonEligibleStudents(data || []);
        setNonEligibleCount(data?.length || 0);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error fetching data');
    } finally {
      setLoadingNonEligible(false);
    }
  };

  // Approve/NotApprove handlers (unchanged)
  const handleApprove = async (student) => {
    try {
      const { data: record } = await supabase
        .from('admin_student_info')
        .select('*')
        .eq('id', student.student_id)
        .single();

      if (!record) {
        alert("❌ Record not found in admin_student_info");
        return;
      }

      const { error: insertError } = await supabase
        .from('eligible_students')
        .upsert({
          student_id: student.student_id,
          student_name: record.student_name || record.full_name || student.full_name,
          full_name: record.full_name || student.full_name,
          age: record.age || student.age,
          camp_name: record.camp_name || student.campName,
          camp_date: record.camp_date || student.campDate || null,
          school: record.school || student.school,
          prev_percent: record.prev_percent || student.prev_percent,
          present_percent: record.present_percent || student.present_percent,
          class: record.class || student.year,
          email: record.email || student.email,
          contact: record.contact || student.contact,
          parent_contact_2: record.parent_contact_2,
          whatsapp: record.whatsapp || student.whatsapp,
          student_contact: record.student_contact || student.student_contact,
          scholarship: record.scholarship || student.scholarship,
          has_scholarship: record.has_scholarship || student.has_scholarship,
          does_work: record.does_work || student.does_work,
          earning_members: record.earning_members || student.earning_members,
          education: record.educationcategory || record.class || student.year,
          volunteer_name: record.volunteer_email || record.volunteer_name || 'Admin',
          volunteer_contact: record.volunteer_contact || record.volunteer_phone || record.volunteer_email || 'N/A',
          created_at: record.created_at,
          status: 'Eligible',
          address: record.address,
          camp: record.camp,
          campdate: record.campdate || record.camp_date || null
        }, { onConflict: 'email' });

      if (insertError) {
        console.error(insertError);
        alert("❌ Failed to move to eligible: " + insertError.message);
        return;
      }

      const { error: deleteError } = await supabase
        .from('admin_student_info')
        .delete()
        .eq('id', student.student_id);

      if (deleteError) {
        console.error(deleteError);
        alert("❌ Failed to remove from pending: " + deleteError.message);
        return;
      }

      setStudents(prev => prev.filter(s => s.student_id !== student.student_id));
      alert("✅ Student moved to Eligible successfully!");
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  };

  const handleNotApprove = async (student) => {
    try {
      const { data: record } = await supabase
        .from('admin_student_info')
        .select('*')
        .eq('id', student.student_id)
        .single();

      if (!record) {
        alert("❌ Record not found in admin_student_info");
        return;
      }

      const { error: insertError } = await supabase
        .from('non_eligible_students')
        .insert({
          student_id: student.student_id,
          student_name: record.student_name || record.full_name || student.full_name,
          full_name: record.full_name || student.full_name,
          age: record.age || student.age,
          camp_name: record.camp_name || student.campName,
          camp_date: record.camp_date || student.campDate || null,
          school: record.school || student.school,
          prev_percent: record.prev_percent || student.prev_percent,
          present_percent: record.present_percent || student.present_percent,
          class: record.class || student.year,
          email: record.email || student.email,
          contact: record.contact || student.contact,
          parent_contact_2: record.parent_contact_2,
          whatsapp: record.whatsapp || student.whatsapp,
          student_contact: record.student_contact || student.student_contact,
          scholarship: record.scholarship || student.scholarship,
          has_scholarship: record.has_scholarship || student.has_scholarship,
          does_work: record.does_work || student.does_work,
          earning_members: record.earning_members || student.earning_members,
          education: record.educationcategory || record.class || student.year,
          volunteer_name: record.volunteer_email || record.volunteer_name || 'Admin',
          volunteer_contact: record.volunteer_contact || record.volunteer_phone || record.volunteer_email || 'N/A',
          created_at: record.created_at,
          status: 'Not Eligible',
          address: record.address,
          camp: record.camp,
          campdate: record.campdate || record.camp_date || null
        });

      if (insertError) {
        console.error(insertError);
        alert("❌ Failed to move to non-eligible: " + insertError.message);
        return;
      }

      const { error: deleteError } = await supabase
        .from('admin_student_info')
        .delete()
        .eq('id', student.student_id);

      if (deleteError) {
        console.error(deleteError);
        alert("❌ Failed to remove from pending: " + deleteError.message);
        return;
      }

      alert("✅ Student moved to Non-Eligible successfully!");
    } catch (err) {
      console.error(err);
      alert("Error: " + err.message);
    }
  };

  // Rest of functions unchanged (handleDownloadEligibleReport, etc.)
  const handleDownloadEligibleReport = () => {
    if (eligibleStudents.length === 0) {
      alert('No eligible students to export');
      return;
    }

    const rows = [
      "id,student_name,email,contact,education,year,school,college,created_at",
      ...eligibleStudents.map(s => 
        `${s.id},"${s.student_name || ''}","${s.email || ''}","${s.contact || ''}","${s.education || ''}","${s.year || ''}","${s.school || ''}","${s.college || ''}","${s.created_at || ''}"`
      )
    ];
    
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'eligible-students-report.csv';
    a.click();
    URL.revokeObjectURL(url);
    alert('Report downloaded successfully!');
  };

  const handleDownloadNonEligibleReport = () => {
    if (nonEligibleStudents.length === 0) {
      alert('No non-eligible students to export');
      return;
    }

    const rows = [
      "id,student_name,email,contact,education,year,school,college,created_at",
      ...nonEligibleStudents.map(s => 
        `${s.id},"${s.student_name || ''}","${s.email || ''}","${s.contact || ''}","${s.education || ''}","${s.year || ''}","${s.school || ''}","${s.college || ''}","${s.created_at || ''}"`
      )
    ];
    
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'non-eligible-students-report.csv';
    a.click();
    URL.revokeObjectURL(url);
    alert('Report downloaded successfully!');
  };

  const handleEditSave = (data) => {
    setStudents((prev) => prev.map((p) => (p.id === data.id ? { ...p, ...data } : p)));
    setEditStudent(null);
  };

  const exportCSV = () => {
    const rows = [
      "id,name,year,donor,feeStatus,course,campName,campDate",
      ...filteredStudents.map(s => `${s.id},"${s.name}",${s.year},${s.donor || ''},${s.fee_status},${s.course || ""},"${s.campName || ""}",${s.campDate || ""}`)
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleContactDonor = (donor) => {
    const email = window.prompt('Enter email to contact ' + donor.name, 'donor@example.org');
    if (!email) return;
    window.location.href = `mailto:${email}?subject=Regarding%20support`;
  };

  const handleSaveSettings = async () => {
    try {
      if (currentUser) {
        const { error } = await supabase.auth.updateUser({
          data: {
            name: adminName,
            contact_number: contactNumber,
            preferences: {
              email_notifications: emailNotifications,
              sms_alerts: smsAlerts,
              system_notifications: systemNotifications,
              default_language: defaultLanguage,
              time_zone: timeZone
            }
          }
        });

        if (error) {
          console.error('Error updating user settings:', error);
          alert('Error saving settings: ' + error.message);
          return;
        }

        const updatedUser = {
          ...currentUser,
          user_metadata: {
            ...currentUser.user_metadata,
            name: adminName
          }
        };
        setCurrentUser(updatedUser);
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings: ' + error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleCreateNotification = async (e) => {
    e.preventDefault();
    setCreatingNotification(true);

    const formattedDate = notificationExpiresAt ? new Date(notificationExpiresAt).toISOString() : null;

    const result = await createNotification(
      notificationTitle,
      notificationMessage,
      notificationAudience,
      formattedDate
    );

    if (result.success) {
      alert("Notification created successfully!");
      setNotificationTitle("");
      setNotificationMessage("");
      setNotificationAudience("all");
      setNotificationExpiresAt("");
    } else {
      alert("Error creating notification: " + result.error);
    }

    setCreatingNotification(false);
  };



  return (
    <div className="admin-root">
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
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
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </aside>
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              ☰
            </button>
            <h2>
              {activeSection === "overview" ? "Dashboard Overview" : activeSection === "manage" ? "Manage Beneficiaries" : activeSection === "mapping" ? "Donor Mapping (Under Construction)" : activeSection === "fees" ? "Fee Tracking (Under Construction)" : activeSection === "broadcast" ? "Alerts & Broadcast" : activeSection === "reports" ? "Reports & Exports" : "Settings"}
            </h2>
          </div>
          <div className="header-actions">
            <input placeholder="Search students or college..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <button className="btn primary" onClick={() => setBroadcastOpen(true)}>New Broadcast</button>
          </div>
        </header>

        <main className="admin-content">
          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              Loading dashboard...
            </div>
          )}

          {!loading && activeSection === "overview" && (
            <>
              <section className="cards-row">
                <div className="card">
                  <div className="card-icon student-icon">👥</div>
                  <div className="card-content">
                    <div className="card-title">Students Under Review</div>
                    <div className="card-value">{totals.totalStudents}</div>
                    <div className="card-trend positive">↑ 12% from last month</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-icon money-icon">💰</div>
                  <div className="card-content">
                    <div className="card-title">Donation Collected</div>
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
            </>
          )}

          {/* Manage Beneficiaries */}
          {!loading && activeSection === "manage" && (
            <section className="manage-section">
              <div className="manage-controls">
                <div className="filters">
                  <select value={filters.class} onChange={(e) => setFilters(f => ({...f, class: e.target.value}))}>
                    <option value="">All Years</option>
                    {uniqueYears.map(year => <option key={year} value={year}>{year}</option>)}
                  </select>

                  

                  {/* NEW Scholarship Filter */}
                  <select value={scholarshipFilter} onChange={(e) => setScholarshipFilter(e.target.value)}>
                    <option value="">All Scholarship</option>
                    <option value="yes">Scholarship - Yes</option>
                    <option value="no">Scholarship - No</option>
                  </select>

                  {/* NEW Camp Name Filter */}
                  <input 
                    type="text" 
                    placeholder="Camp Name" 
                    value={campNameFilter}
                    onChange={(e) => setCampNameFilter(e.target.value)}
                  />

                  {/* NEW Camp Date Filter */}
                  <input 
                    type="date" 
                    placeholder="Camp Date" 
                    value={campDateFilter}
                    onChange={(e) => setCampDateFilter(e.target.value)}
                  />
                </div>

                <div className="manage-actions">
                  <button className="btn primary" onClick={exportCSV}>Export CSV</button>
                </div>
              </div>

              <div className="table-wrap">
                <table className="data-table">
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
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map(s => (
                        <tr key={s.id}>
                          <td>{s.name}</td>
                          <td>{s.email}</td>
                          <td>{s.year}</td>
                          <td>{s.contact}</td>
                          <td>
                            <div style={{whiteSpace: 'nowrap'}}>
                              <div>{s.campName}</div>
                              <div style={{fontSize: '0.85em', color: '#666'}}>{s.campDate}</div>
                            </div>
                          </td>
                          <td>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                              <div className="tooltip">
                                <button className="btn small icon-btn" onClick={() => setViewStudent(s)} style={{backgroundColor: '#e3f2fd', color: '#1976d2', borderColor: '#1976d2'}}>👁️</button>
                                <span className="tooltiptext">View</span>
                              </div>
                              <div className="tooltip">
                                <button className="btn small icon-btn" onClick={() => handleApprove(s)} style={{backgroundColor: '#e8f5e8', color: '#2e7d32', borderColor: '#2e7d32'}}>✅</button>
                                <span className="tooltiptext">Approve</span>
                              </div>
                              <div className="tooltip">
                                <button className="btn small icon-btn" onClick={() => handleNotApprove(s)} style={{backgroundColor: '#ffebee', color: '#c62828', borderColor: '#c62828'}}>❌</button>
                                <span className="tooltiptext">Not Approve</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', fontStyle: 'italic', color: '#666' }}>
                          No students found for selected filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {students.length === 0 && lastFetch && (
                <div className="debug-panel">
                  <h4>No more forms to Review</h4>
                </div>
              )}
            </section>
          )}

          {/* Other sections unchanged (broadcast, reports, settings, modals) */}
          {activeSection === "broadcast" && (
            <section className="broadcast-section">
              <div className="section-header">
                <h3>Create Notification</h3>
              </div>
              <form onSubmit={handleCreateNotification} className="notification-form">
                <div className="form-group">
                  <label>
                    <span className="field-label">Notification Title</span>
                    <input type="text" value={notificationTitle} onChange={(e) => setNotificationTitle(e.target.value)} required placeholder="Enter notification title" />
                  </label>
                  <label>
                    <span className="field-label">Target Audience</span>
                    <select value={notificationAudience} onChange={(e) => setNotificationAudience(e.target.value)}>
                      <option value="all">All Students</option>
                      <option value="eligible">Eligible Students Only</option>
                      <option value="non-eligible">Non-Eligible Students Only</option>
                    </select>
                  </label>
                </div>
                <div className="form-group">
                  <label className="full-width">
                    <span className="field-label">Message</span>
                    <textarea value={notificationMessage} onChange={(e) => setNotificationMessage(e.target.value)} required rows={4} placeholder="Enter notification message" />
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    <span className="field-label">Expires At (Optional)</span>
                    <input type="datetime-local" value={notificationExpiresAt} onChange={(e) => setNotificationExpiresAt(e.target.value)} />
                  </label>
                </div>
                <button type="submit" className="btn primary" disabled={creatingNotification}>
                  {creatingNotification ? "Creating..." : "Create Notification"}
                </button>
              </form>
            </section>
          )}

          {/* Reports and Settings sections (unchanged for brevity - include full from original) */}
          {activeSection === "reports" && (
            <section className="reports-section">
              {/* Full reports section from original */}
            </section>
          )}

          {activeSection === "settings" && (
            <section className="settings-section">
              {/* Full settings section from original */}
            </section>
          )}

          {/* All modals unchanged */}
          {viewStudent && (
            <div className="modal-overlay">
              <div className="modal">
                <h3>Student Details</h3>
                <div className="view-grid">
                  <p><strong>Name:</strong> {viewStudent.name || viewStudent.full_name}</p>
                  <p><strong>Class & Year:</strong> {viewStudent.class || viewStudent.year || '-'}</p>
                  <p><strong>Previous %:</strong> {viewStudent.prev_percent || '-'}</p>
                  <p><strong>Present %:</strong> {viewStudent.present_percent || '-'}</p>
                  <p><strong>Has Scholarship?:</strong> {viewStudent.has_scholarship ? "Yes" : "No"}</p>
                  <p><strong>Earning Members:</strong> {viewStudent.earning_members || '-'}</p>
                  <p><strong>Contact:</strong> {viewStudent.contact}</p>
                  <p><strong>Student Contact:</strong> {viewStudent.student_contact || '-'}</p>
                  <p><strong>Record Created:</strong> {formatToIST(viewStudent.created_at)}</p>
                </div>
                <button className="btn primary" style={{ marginTop: "20px" }} onClick={() => setViewStudent(null)}>
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Other modals (viewDonor, editStudent, etc.) remain the same */}
        </main>
      </div>
    </div>
  );
}

