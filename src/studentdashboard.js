import React, { useState } from 'react';

const StudentDashboard = () => {
  const [student, setStudent] = useState({
    name: 'Katie Johnson',
    studentId: 'STU2024001',
    email: 'katie.johnson@student.edu',
    program: 'Computer Science',
    semester: '4th',
    enrollmentDate: '2023-09-01'
  });

  const [academicData, setAcademicData] = useState({
    cgpa: 3.75,
    attendance: 92.5,
    completedCredits: 78,
    totalCredits: 120
  });

  const [feeStatus, setFeeStatus] = useState({
    totalFee: 5000,
    paidByTAL: 3500,
    paidByStudent: 0,
    dueDate: '2025-11-15'
  });

  const [documents, setDocuments] = useState([
    { id: 1, name: 'Semester 3 Marksheet', type: 'certificate', uploadedDate: '2024-06-15' },
    { id: 2, name: 'Fee Receipt - Oct 2024', type: 'receipt', uploadedDate: '2024-10-05' },
    { id: 3, name: 'Identity Card', type: 'id', uploadedDate: '2023-09-10' }
  ]);

  const [alerts, setAlerts] = useState([
    { id: 1, type: 'workshop', title: 'Web Development Workshop', date: '2025-10-20', priority: 'high' },
    { id: 2, type: 'deadline', title: 'Document Submission Deadline', date: '2025-10-25', priority: 'high' },
    { id: 3, type: 'fee', title: 'Fee Payment Reminder', date: '2025-11-10', priority: 'medium' },
    { id: 4, type: 'event', title: 'Career Guidance Session', date: '2025-10-30', priority: 'low' }
  ]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');

  const handleFileUpload = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    // Simulate upload
    setTimeout(() => {
      const newDoc = { id: documents.length + 1, name: file.name, type: 'certificate', uploadedDate: new Date().toISOString().split('T')[0] };
      setDocuments(prev => [...prev, newDoc]);
      setUploadMessage('Document uploaded successfully!');
      setSelectedFile(null);
      setTimeout(() => setUploadMessage(''), 3000);
    }, 800);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'low': return '#44ff44';
      default: return '#cccccc';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'workshop': return '📚';
      case 'deadline': return '⏰';
      case 'fee': return '💰';
      case 'event': return '🎯';
      default: return '🔔';
    }
  };

  // Derived fee values
  const paidByTAL = feeStatus.paidByTAL || 0;
  const paidByStudent = feeStatus.paidByStudent || 0;
  const dueAmount = Math.max(0, feeStatus.totalFee - paidByTAL - paidByStudent);
  const displayStatus = dueAmount === 0 ? 'Paid' : (paidByTAL + paidByStudent === 0 ? 'Not Paid' : 'Partially Paid');

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Student Dashboard</h1>
          <div style={styles.userInfo}>
            <span style={styles.welcome}>Welcome, {student.name}!</span>
            <div style={styles.profileBadge}>
              <span style={styles.studentId}>{student.studentId}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.mainContent}>
        {/* Left Sidebar - Quick Stats */}
        <div style={styles.sidebar}>
          {/* Student Profile Card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Student Profile</h3>
            <div style={styles.profileInfo}>
              <div style={styles.infoRow}><span style={styles.infoLabel}>Program:</span><span style={styles.infoValue}>{student.program}</span></div>
              <div style={styles.infoRow}><span style={styles.infoLabel}>Semester:</span><span style={styles.infoValue}>{student.semester}</span></div>
              <div style={styles.infoRow}><span style={styles.infoLabel}>Enrollment:</span><span style={styles.infoValue}>{student.enrollmentDate}</span></div>
              <div style={styles.infoRow}><span style={styles.infoLabel}>Email:</span><span style={styles.infoValue}>{student.email}</span></div>
            </div>
          </div>

          {/* Academic Performance Card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Academic Performance</h3>
            <div style={styles.statsGrid}>
              <div style={styles.statItem}><div style={styles.statValue}>{academicData.cgpa}</div><div style={styles.statLabel}>CGPA</div></div>
              <div style={styles.statItem}><div style={styles.statValue}>{academicData.attendance}%</div><div style={styles.statLabel}>Attendance</div></div>
              <div style={styles.statItem}><div style={styles.statValue}>{academicData.completedCredits}/{academicData.totalCredits}</div><div style={styles.statLabel}>Credits</div></div>
            </div>
          </div>

          {/* Fee Status Card */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Fee Status</h3>
            <div style={styles.feeInfo}>
              <div style={styles.feeRow}><span>Total Fee:</span><span style={styles.feeAmount}>${feeStatus.totalFee}</span></div>
              <div style={styles.feeRow}><span>Paid (By TAL):</span><span style={styles.feePaid}>${paidByTAL}</span></div>
              <div style={styles.feeRow}><span>Paid (By Student):</span><span style={styles.feePaid}>${paidByStudent}</span></div>
              <div style={styles.feeRow}><span>Due:</span><span style={styles.feeDue}>${dueAmount}</span></div>
              <div style={styles.feeRow}><span>Due Date:</span><span>{feeStatus.dueDate}</span></div>
              <div style={{ ...styles.statusBadge, backgroundColor: displayStatus === 'Paid' ? '#4CAF50' : '#FF9800' }}>{displayStatus}</div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={styles.content}>
          {/* Alerts Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}><h2 style={styles.sectionTitle}>Alerts & Reminders</h2><span style={styles.alertsCount}>{alerts.length} alerts</span></div>
            <div style={styles.alertsGrid}>{alerts.map(a => (
              <div key={a.id} style={styles.alertCard}>
                <div style={styles.alertHeader}><span style={styles.alertIcon}>{getAlertIcon(a.type)}</span><div style={{ ...styles.priorityDot, backgroundColor: getPriorityColor(a.priority) }} /></div>
                <h4 style={styles.alertTitle}>{a.title}</h4>
                <div style={styles.alertDate}>{a.date}</div>
              </div>
            ))}</div>
          </div>

          {/* Documents Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}><h2 style={styles.sectionTitle}>My Documents</h2>
              <div style={styles.uploadSection}><input id="fileUpload" type="file" style={styles.fileInput} onChange={handleFileUpload} /><label htmlFor="fileUpload" style={styles.uploadButton}>📁 Upload Document</label>{uploadMessage && <span style={styles.uploadMessage}>{uploadMessage}</span>}</div>
            </div>
            <div style={styles.documentsTable}><div style={styles.tableHeader}><div style={styles.tableCell}>Document Name</div><div style={styles.tableCell}>Type</div><div style={styles.tableCell}>Uploaded Date</div><div style={styles.tableCell}>Actions</div></div>
              {documents.map(doc => (<div key={doc.id} style={styles.tableRow}><div style={styles.tableCell}>{doc.name}</div><div style={styles.tableCell}><span style={styles.docTypeBadge}>{doc.type}</span></div><div style={styles.tableCell}>{doc.uploadedDate}</div><div style={styles.tableCell}><button style={styles.smallButton}>Download</button><button style={{ ...styles.smallButton, backgroundColor: '#ff4444' }}>Delete</button></div></div>))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Upcoming Workshops & Events</h2>
            <div style={styles.eventsList}>
              {alerts.filter(alert => alert.type === 'workshop' || alert.type === 'event').map(event => (
                <div key={event.id} style={styles.eventItem}>
                  <div style={styles.eventDate}><div style={styles.eventDay}>{new Date(event.date).getDate()}</div><div style={styles.eventMonth}>{new Date(event.date).toLocaleString('default', { month: 'short' })}</div></div>
                  <div style={styles.eventDetails}><h4 style={styles.eventTitle}>{event.title}</h4><div style={styles.eventType}>{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</div></div>
                  <button style={styles.registerButton}>Register</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f6fa',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  header: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '20px 0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '600',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  welcome: {
    fontSize: '16px',
    opacity: 0.9,
  },
  profileBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: '8px 12px',
    borderRadius: '20px',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  studentId: {
    fontSize: '14px',
    fontWeight: '500',
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '30px auto',
    padding: '0 20px',
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '30px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #e1e8ed',
  },
  cardTitle: {
    margin: '0 0 15px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#2c3e50',
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  infoLabel: {
    fontWeight: '500',
    color: '#666',
    fontSize: '14px',
  },
  infoValue: {
    fontWeight: '600',
    color: '#2c3e50',
    fontSize: '14px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '10px',
  },
  statItem: {
    textAlign: 'center',
    padding: '15px 10px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '500',
  },
  feeInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  feeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '14px',
  },
  feeAmount: {
    fontWeight: '600',
  },
  feePaid: {
    fontWeight: '600',
    color: '#4CAF50',
  },
  feeDue: {
    fontWeight: '600',
    color: '#FF9800',
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: '10px',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #e1e8ed',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '600',
    color: '#2c3e50',
  },
  alertsCount: {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
  },
  alertsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  alertCard: {
    border: '1px solid #e1e8ed',
    borderRadius: '10px',
    padding: '20px',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  },
  alertCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(0,0,0,0.1)',
  },
  alertHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
  },
  alertIcon: {
    fontSize: '24px',
  },
  priorityDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
  },
  alertTitle: {
    margin: '0 0 10px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#2c3e50',
  },
  alertDate: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '15px',
  },
  alertActions: {
    display: 'flex',
    gap: '10px',
  },
  actionButton: {
    padding: '8px 16px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  uploadSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  fileInput: {
    display: 'none',
  },
  uploadButton: {
    padding: '10px 20px',
    backgroundColor: '#27ae60',
    color: 'white',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s',
  },
  uploadMessage: {
    color: '#27ae60',
    fontSize: '14px',
    fontWeight: '500',
  },
  documentsTable: {
    border: '1px solid #e1e8ed',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1.5fr',
    backgroundColor: '#f8f9fa',
    padding: '15px 20px',
    fontWeight: '600',
    color: '#2c3e50',
    borderBottom: '1px solid #e1e8ed',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1.5fr',
    padding: '15px 20px',
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'center',
  },
  tableCell: {
    display: 'flex',
    alignItems: 'center',
  },
  docTypeBadge: {
    padding: '4px 8px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  smallButton: {
    padding: '6px 12px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    marginRight: '8px',
  },
  eventsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  eventItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px',
    border: '1px solid #e1e8ed',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
  },
  eventDate: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '60px',
    height: '60px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    padding: '10px',
  },
  eventDay: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#2c3e50',
  },
  eventMonth: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '500',
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    margin: '0 0 5px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#2c3e50',
  },
  eventType: {
    fontSize: '14px',
    color: '#666',
  },
  registerButton: {
    padding: '8px 16px',
    backgroundColor: '#9b59b6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default StudentDashboard;