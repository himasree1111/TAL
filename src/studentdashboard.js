import React, { useEffect, useMemo, useState } from "react";
import "./studentdashboard.css";
import { useNavigate } from "react-router-dom";
import supabase from "./supabaseClient";
import {
  getStudentNotifications,
  subscribeToNotifications,
  filterNotification,
} from "./notificationService";
import { useStudent } from "./StudentContext";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard Overview", icon: "🏠" },
  { key: "profile", label: "My Profile", icon: "👤" },
  { key: "notifications", label: "Alerts & Broadcasts", icon: "🔔" },
  { key: "documents", label: "Document Upload", icon: "📄" },
  { key: "settings", label: "Student Settings", icon: "⚙️" },
];

const DOCUMENT_CATEGORIES = [
  { key: "semester", title: "Semester Documents", icon: "📚" },
  { key: "fee", title: "Fee Receipts", icon: "💰" },
  { key: "certificates", title: "Certificates", icon: "🎓" },
];

const initialDocumentState = DOCUMENT_CATEGORIES.reduce((acc, curr) => {
  acc[curr.key] = [];
  return acc;
}, {});

const formatRelative = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 5) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const isImportantNotification = (item) => {
  const title = item.title?.toLowerCase() || "";
  const message = item.message?.toLowerCase() || "";
  return title.includes("urgent") || title.includes("important") || message.includes("urgent") || message.includes("important");
};

const StatCard = ({ icon, label, value }) => (
  <div className="stat-card">
    <div className="stat-icon" aria-hidden="true">
      {icon}
    </div>
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  </div>
);

const getStudentType = async (studentId) => {
  const { data: eligible } = await supabase
    .from("eligible_students")
    .select("id")
    .eq("id", studentId)
    .single();

  if (eligible) return "eligible";

  const { data: nonEligible } = await supabase
    .from("non_eligible_students")
    .select("id")
    .eq("id", studentId)
    .single();

  if (nonEligible) return "non-eligible";

  return "all";
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("dashboard");
  //const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [notifFilter, setNotifFilter] = useState("all");
  const [documents, setDocuments] = useState(initialDocumentState);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState("");
  const [settings, setSettings] = useState({ name: '', email: '', phone: '' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [studentId, setStudentId] = useState(null);
  const [studentType, setStudentType] = useState(null);
  const { studentEmail, logout: contextLogout } = useStudent();
    
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    dob: '',
    age: '',
    pob: '',
    nationality: '',
    address: '',
    class: '',
    educationcategory: '',
    educationsubcategory: '',
    educationyear: '',
    educationcategory_custom: '',
    educationsubcategory_custom: '',
    educationyear_custom: '',
    email: '',
    contact: '',
    parent_contact_2: '',
    whatsapp: '',
    student_contact: '',
    school: '',
    branch: '',
    prev_percent: '',
    present_percent: '',
    fee: '',
    educational_expenses: {
      tuition_fee: { checked: false, amount: '' },
      books_study_materials: { checked: false, amount: '' },
      uniform: { checked: false, amount: '' },
      transport_fee: { checked: false, amount: '' },
      examination_fee: { checked: false, amount: '' },
      hostel_accommodation: { checked: false, amount: '' },
      food_mess_charges: { checked: false, amount: '' }
    },
    job: '',
    aspiration: '',
    scholarship: '',
    num_family_members: '',
    family_members_details: [],
    num_earning_members: '',
    earning_members_details: [],
    account_no: '',
    bank_name: '',
    bank_branch: '',
    ifsc_code: '',
    special_remarks: '',
    academic_achievements: '',
    non_academic_achievements: '',
    is_single_parent: '',
    does_work: '',
    has_scholarship: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [originalFormData, setOriginalFormData] = useState(null);

useEffect(() => {
  
  let subscription;

  const init = async () => {
    if (!studentEmail) return;
    
    console.log("Loading for student:", studentEmail);
    
    const { data: profileData, error: profileError } = await supabase
      .from('eligible_students')
      .select('*')
      .eq('email', studentEmail)
      .single();
    
    console.log('[PROFILE] eligible_students query result:', { profileData, profileError });
    
    if (profileError || !profileData) {
      console.error('Profile fetch error:', profileError);
      // Try non_eligible
      const { data: nonEligibleData, error: nonError } = await supabase
        .from('non_eligible_students')
        .select('*')
        .eq('email', studentEmail)
        .single();
      console.log('[PROFILE] non_eligible_students query result:', { nonEligibleData, nonError });
      if (nonError || !nonEligibleData) {
        console.error('No profile found in either table:', nonError);
        return;
      }
      setProfile(nonEligibleData);
      setStudentId(nonEligibleData.id);
    } else {
      setProfile(profileData);
      setStudentId(profileData.id);
    }
    
    setSettings({
      name: profileData?.full_name || profileData?.name || '',
      email: profileData?.email || '',
      phone: profileData?.phone || ''
    });
    
    console.log("Student ID:", studentId);
    console.log("Student profile:", profile);
    
    const type = await getStudentType(studentId);
    console.log("[DASHBOARD] Student Type:", type);
    setStudentType(type);
    
    const res = await getStudentNotifications(type);
    console.log("[DASHBOARD] Fetched Notifications:", res);
    if (res.success) {
      console.log(`[DASHBOARD] Setting ${res.notifications.length} notifications`);
      setNotifications(res.notifications);
    }
    
    subscription = subscribeToNotifications((newData) => {
      console.log("[DASHBOARD] Realtime incoming:", newData);
      if (!studentType) return;
      if (filterNotification(newData, studentType)) {
        setNotifications(prev => {
          const exists = prev.some(n => n.id === newData.id);
          if (exists) {
            console.log("[DASHBOARD] Duplicate realtime notification ignored");
            return prev;
          }
          console.log("[DASHBOARD] Adding filtered realtime notification");
          return [newData, ...prev];
        });
      } else {
        console.log("[DASHBOARD] Realtime notification filtered OUT");
      }
    });
  };

  init();

  return () => {
    if (subscription) supabase.removeChannel(subscription);
  };
}, [studentEmail, profile, studentId, studentType]);

// Fetch profile form data when component mounts or studentEmail changes
useEffect(() => {
  const fetchProfileFormData = async () => {
    if (!studentEmail) {
      console.log('[PROFILE] No studentEmail available');
      return;
    }
    
    setProfileLoading(true);
    try {
      console.log('[PROFILE] Fetching from student_form_submissions with email:', studentEmail);
      
      // Fetch from student_form_submissions using email
      const { data: formData, error } = await supabase
        .from('student_form_submissions')
        .select('*')
        .eq('email', studentEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      console.log('[PROFILE] Query result:', { formData, error });
      
      if (error) {
        console.error('Error fetching profile form:', error);
        setProfileLoading(false);
        return;
      }
      
      if (formData) {
        // Map the form data to profileForm state based on actual table schema
        console.log('[PROFILE] Fetched formData from student_form_submissions:', formData);
        
        const mappedData = {
          first_name: formData.first_name || '',
          last_name: formData.last_name || '',
          middle_name: formData.middle_name || '',
          dob: formData.dob || '',
          age: formData.age?.toString() || '',
          pob: formData.pob || '',
          nationality: formData.nationality || '',
          address: formData.address || '',
          class: formData.class || '',
          educationcategory: formData.educationcategory || '',
          educationsubcategory: formData.educationsubcategory || '',
          educationyear: formData.educationyear || '',
          educationcategory_custom: '',
          educationsubcategory_custom: '',
          educationyear_custom: '',
          email: formData.email || '',
          contact: formData.contact || '',
          parent_contact_2: formData.parent_contact_2 || '',
          whatsapp: formData.whatsapp || '',
          student_contact: formData.student_contact || '',
          school: formData.school || '',
          branch: formData.branch || '',
          prev_percent: formData.prev_percent?.toString() || '',
          present_percent: formData.present_percent?.toString() || '',
          fee: formData.fee?.toString() || '',
          educational_expenses: formData.educational_expenses || {
            tuition_fee: { checked: false, amount: '' },
            books_study_materials: { checked: false, amount: '' },
            uniform: { checked: false, amount: '' },
            transport_fee: { checked: false, amount: '' },
            examination_fee: { checked: false, amount: '' },
            hostel_accommodation: { checked: false, amount: '' },
            food_mess_charges: { checked: false, amount: '' }
          },
          job: formData.job || '',
          aspiration: formData.aspiration || '',
          scholarship: formData.scholarship || '',
          num_family_members: formData.num_family_members?.toString() || '',
          family_members_details: formData.family_members_details || [],
          num_earning_members: formData.earning_members?.toString() || '',
          earning_members_details: formData.earning_members_details || [],
          account_no: formData.account_no || '',
          bank_name: formData.bank_name || '',
          bank_branch: formData.bank_branch || '',
          ifsc_code: formData.ifsc_code || '',
          special_remarks: formData.special_remarks || '',
          academic_achievements: formData.academic_achievements || '',
          non_academic_achievements: formData.non_academic_achievements || '',
          is_single_parent: formData.is_single_parent ? 'YES' : 'NO',
          does_work: formData.does_work ? 'YES' : 'NO',
          has_scholarship: formData.has_scholarship ? 'YES' : 'NO'
        };
        
        setProfileForm(mappedData);
        setOriginalFormData(mappedData); // Store original data for cancel functionality
        console.log('[PROFILE] Mapped profileForm data:', mappedData);
      } else {
        console.log('[PROFILE] No formData found for student email:', studentEmail);
      }
    } catch (err) {
      console.error('Error in fetchProfileFormData:', err);
    } finally {
      setProfileLoading(false);
    }
  };
  
  fetchProfileFormData();
}, [studentEmail]);


const handleLogout = () => {
    contextLogout();
    navigate("/");
  };

  
  const handleUpload = async (category, files) => {
    setError("");

    const tasks = Array.from(files).map(async (file) => {
      const id = `${category}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setUploadProgress((prev) => ({ ...prev, [id]: { progress: 0, name: file.name } }));

      const safeId = studentId || studentEmail?.replace(/[^a-zA-Z0-9]/g, '_') || 'default';
      const folder = `student_docs/${safeId}/${category}`;
      const fileName = `${Date.now()}_${file.name}`.replace(/\s+/g, "_");
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("student_documents")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        setError("Upload failed. Please try again.");
        setUploadProgress((prev) => ({ ...prev, [id]: { ...prev[id], progress: 0, error: true } }));
        return null;
      }

      const { data: publicData } = supabase.storage
        .from("student_documents")
        .getPublicUrl(filePath);

      const docEntry = {
        id,
        name: file.name,
        category,
        uploadedAt: new Date().toISOString(),
        url: publicData?.publicUrl || null,
        status: "pending",
      };

      setDocuments((prev) => ({
        ...prev,
        [category]: [docEntry, ...(prev[category] || [])],
      }));

      setUploadProgress((prev) => ({ ...prev, [id]: { ...prev[id], progress: 100 } }));
      return docEntry;
    });

    await Promise.all(tasks);
  };

  const handleRemoveDocument = (category, id) => {
    setDocuments((prev) => ({
      ...prev,
      [category]: prev[category].filter((doc) => doc.id !== id),
    }));
  };

  const handleSettingsChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaveSuccess(false);
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setError("");
    setSaveSuccess(false);

    try {
      const updates = {
        full_name: settings.name,
        phone: settings.phone,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from("eligible_students")
        .update(updates)
        .eq('email', studentEmail);
      if (updateError) throw updateError;

      setSaveSuccess(true);
      setProfile((prev) => ({ ...prev, full_name: settings.name }));
    } catch (err) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Profile form handlers
  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    // Reset to original data
    setProfileForm(originalFormData);
    setIsEditing(false);
    setProfileMessage('');
    setProfileError('');
  };

  const handleProfileChange = (field, value) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
    setProfileMessage('');
    setProfileError('');
  };

  const handleEducationalExpenseChange = (expenseKey, field, value) => {
    const updatedExpenses = {
      ...profileForm.educational_expenses,
      [expenseKey]: {
        ...profileForm.educational_expenses[expenseKey],
        [field]: value
      }
    };
    setProfileForm(prev => ({ ...prev, educational_expenses: updatedExpenses }));
  };

  const handleFamilyMemberChange = (index, field, value) => {
    const updatedDetails = [...profileForm.family_members_details];
    if (updatedDetails[index]) {
      updatedDetails[index][field] = value;
    }
    setProfileForm(prev => ({ ...prev, family_members_details: updatedDetails }));
  };

  const handleEarningMemberChange = (index, field, value) => {
    const updatedDetails = [...profileForm.earning_members_details];
    if (updatedDetails[index]) {
      updatedDetails[index][field] = value;
    }
    setProfileForm(prev => ({ ...prev, earning_members_details: updatedDetails }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage('');
    setProfileError('');

    try {
      // Prepare payload for eligible_students - ONLY update fields that exist in the table
      const fullName = `${profileForm.first_name} ${profileForm.middle_name || ''} ${profileForm.last_name}`.trim();
      
      const eligibleStudentsUpdate = {
        full_name: fullName,
        student_name: fullName,
        email: profileForm.email,
        contact: profileForm.contact,
        whatsapp: profileForm.whatsapp,
        parent_contact_2: profileForm.parent_contact_2,
        student_contact: profileForm.student_contact,
        address: profileForm.address
        // No updated_at column in eligible_students table
      };

      // Update eligible_students
      const { error: eligibleError } = await supabase
        .from('eligible_students')
        .update(eligibleStudentsUpdate)
        .eq('email', studentEmail);

      if (eligibleError) throw eligibleError;

      // Update student_form_submissions with timestamp
      const formSubmissionUpdate = {
        first_name: profileForm.first_name,
        middle_name: profileForm.middle_name || null,
        last_name: profileForm.last_name,
        full_name: fullName,
        dob: profileForm.dob || null,
        age: parseInt(profileForm.age) || null,
        pob: profileForm.pob || null,
        nationality: profileForm.nationality || null,
        address: profileForm.address,
        class: profileForm.class,
        educationcategory: profileForm.educationcategory || null,
        educationsubcategory: profileForm.educationsubcategory || null,
        educationyear: profileForm.educationyear || null,
        email: profileForm.email,
        contact: profileForm.contact,
        parent_contact_2: profileForm.parent_contact_2 || null,
        whatsapp: profileForm.whatsapp,
        student_contact: profileForm.student_contact || null,
        school: profileForm.school,
        branch: profileForm.branch || null,
        prev_percent: parseFloat(profileForm.prev_percent) || null,
        present_percent: parseFloat(profileForm.present_percent) || null,
        fee: profileForm.fee || null,
        educational_expenses: profileForm.educational_expenses,
        job: profileForm.job || null,
        aspiration: profileForm.aspiration || null,
        scholarship: profileForm.scholarship || null,
        num_family_members: parseInt(profileForm.num_family_members) || 0,
        family_members_details: profileForm.family_members_details,
        earning_members: parseInt(profileForm.num_earning_members) || 0,
        earning_members_details: profileForm.earning_members_details,
        account_no: profileForm.account_no || null,
        bank_name: profileForm.bank_name || null,
        bank_branch: profileForm.bank_branch || null,
        ifsc_code: profileForm.ifsc_code || null,
        special_remarks: profileForm.special_remarks || null,
        academic_achievements: profileForm.academic_achievements || null,
        non_academic_achievements: profileForm.non_academic_achievements || null,
        is_single_parent: profileForm.is_single_parent === 'YES',
        does_work: profileForm.does_work === 'YES',
        has_scholarship: profileForm.has_scholarship === 'YES'
      };

      // Update student_form_submissions
      const { error: submissionError } = await supabase
        .from('student_form_submissions')
        .update(formSubmissionUpdate)
        .eq('email', studentEmail);

      if (submissionError) throw submissionError;

      // Update admin_student_info if exists (only update relevant fields)
      const { data: adminData } = await supabase
        .from('admin_student_info')
        .select('id')
        .eq('email', studentEmail)
        .maybeSingle();

      if (adminData) {
        const adminUpdate = {
          full_name: fullName,
          email: profileForm.email,
          contact: profileForm.contact,
          whatsapp: profileForm.whatsapp,
          parent_contact_2: profileForm.parent_contact_2,
          student_contact: profileForm.student_contact,
          address: profileForm.address,
          scholarship: profileForm.scholarship,
          has_scholarship: profileForm.has_scholarship === 'YES',
          does_work: profileForm.does_work === 'YES',
          earning_members: parseInt(profileForm.num_earning_members) || 0
        };
        
        const { error: adminError } = await supabase
          .from('admin_student_info')
          .update(adminUpdate)
          .eq('email', studentEmail);

        if (adminError) {
          console.error('Error updating admin_student_info:', adminError);
          // Don't throw - this is optional
        }
      }

      setProfileMessage('Profile updated successfully!');
      setOriginalFormData(profileForm); // Update original data with new values
      setIsEditing(false); // Exit edit mode after successful save
      
      // Update profile context
      setProfile(prev => ({ ...prev, full_name: fullName, student_name: fullName, contact: profileForm.contact }));
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const totalDocuments = useMemo(() => Object.values(documents).flat().length, [documents]);

  const totalNotifications = notifications.length;

  const filteredNotifications = useMemo(() => {
    const list = [...notifications].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

   

    if (notifFilter === "important") {
      return list.filter(isImportantNotification);
    }

    return list;
  }, [notifications, notifFilter]);

  const renderSidebar = () => (
    <aside className="student-sidebar">
      <div className="profile-card">
        <div className="avatar" aria-hidden="true">
          {profile.name ? profile.name.charAt(0).toUpperCase() : "S"}
        </div>
        <div className="profile-meta">
          <h3>{profile.full_name?.trim() || "Student"}</h3>
{/* profile.id && <p className="subtle">ID: {profile.id}</p> */}
          {profile.email && <p className="subtle">{profile.email}</p>}
        </div>
      </div>

      <nav className="nav-menu">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            className={`nav-item ${activeNav === item.key ? "active" : ""}`}
            onClick={() => setActiveNav(item.key)}
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        Logout
      </button>
    </aside>
  );

  const renderStatsBar = () => (
    <div className="stats-bar">
      <StatCard icon="📄" label="Total Documents" value={totalDocuments} />
      <StatCard icon="🔔" label="Notifications" value={totalNotifications} />
    </div>
  );

  const renderNotificationFilters = () => (
    <div className="filter-bar">
      {[
        { key: "all", label: "All" },
        { key: "important", label: "Important" },
      ].map((option) => (
        <button
          key={option.key}
          className={`filter-button ${notifFilter === option.key ? "active" : ""}`}
          onClick={() => setNotifFilter(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  const renderNotifications = () => {
    if (!filteredNotifications.length) {
      return <div className="empty-state">No notifications match this filter.</div>;
    }

    return (
      <div className="notification-grid">
        {filteredNotifications.map((item) => {
          const isNew = false;
          const isImportant = isImportantNotification(item);

          return (
            <article
              key={item.id}
              className={`notification-card ${isNew ? "new" : "read"} ${
                isImportant ? "important" : ""
              }`}
            >
              <div className="notification-title">
                <strong>{item.title || "Untitled"}</strong>
                <div className="notification-tags">
                  {isNew && <span className="badge">New</span>}
                  {isImportant && <span className="badge important">Important</span>}
                </div>
              </div>
              <p className="notification-message">{item.message}</p>
              <div className="notification-meta">
                <span className="timestamp">{formatRelative(item.created_at)}</span>
              </div>
            </article>
          );
        })}
      </div>
    );
  };

  const renderDocumentUpload = () => (
    <div className="documents-grid">
      {DOCUMENT_CATEGORIES.map((category) => {
        const docs = documents[category.key] || [];
        return (
          <section key={category.key} className="doc-card">
            <div className="doc-card-header">
              <div>
                <div className="doc-tag">{category.icon}</div>
                <h3>{category.title}</h3>
                <p className="doc-subtitle">Upload, preview and manage your files.</p>
              </div>
              <label className="upload-action">
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      handleUpload(category.key, e.target.files);
                      e.target.value = null;
                    }
                  }}
                />
                <span className="upload-btn">Upload</span>
              </label>
            </div>

            {!docs.length && <div className="empty-state">No files uploaded yet.</div>}

            {docs.map((doc) => (
              <div key={doc.id} className="doc-row">
                <div className="doc-meta">
                  <div className="doc-name">{doc.name}</div>
                  <div className="doc-subtle">
                    {doc.status === "approved" ? "Verified" : "Pending"} •{' '}
                    {new Date(doc.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="doc-actions">
                  {doc.url ? (
                    <a className="link" href={doc.url} target="_blank" rel="noreferrer">
                      View
                    </a>
                  ) : (
                    <span className="subtle">Processing…</span>
                  )}
                  <button
                    className="icon-btn"
                    onClick={() => handleRemoveDocument(category.key, doc.id)}
                    aria-label="Remove file"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {Object.entries(uploadProgress)
              .filter(([key]) => key.startsWith(category.key))
              .map(([key, progress]) => (
                <div key={key} className="upload-progress">
                  <div className="upload-meta">
                    <span>{progress.name}</span>
                    {progress.error ? (
                      <span className="upload-error">Failed</span>
                    ) : (
                      <span className="upload-percent">{progress.progress}%</span>
                    )}
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                </div>
              ))}
          </section>
        );
      })}
    </div>
  );

  const renderSettings = () => (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>Student Settings</h2>
        <p className="section-note">Update your profile and change your password.</p>
      </div>

      <form
        className="settings-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveSettings();
        }}
      >
        <div className="form-row">
          <label>Name</label>
          <input
            value={settings.name}
            onChange={(e) => handleSettingsChange("name", e.target.value)}
            placeholder="Full name"
          />
        </div>

        <div className="form-row">
          <label>Email</label>
          <input
            value={settings.email}
            onChange={(e) => handleSettingsChange("email", e.target.value)}
            placeholder="Email address"
          />
        </div>

        <div className="form-row">
          <label>Phone</label>
          <input
            value={settings.phone}
            onChange={(e) => handleSettingsChange("phone", e.target.value)}
            placeholder="Phone number"
          />
        </div>

        <div className="form-actions">
          <button className="btn primary" type="submit" disabled={savingSettings}>
            {savingSettings ? "Saving…" : "Save Changes"}
          </button>
          {saveSuccess && <span className="success-text">Saved successfully.</span>}
        </div>
      </form>
    </div>
  );

  const renderProfile = () => (
    <div className="settings-panel">
      <div className="settings-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>My Profile</h2>
          <p className="section-note">View and update your personal information, academic details, and family background.</p>
        </div>
        {!isEditing ? (
          <button 
            className="btn primary" 
            onClick={handleEditClick}
            style={{ padding: '10px 20px', fontSize: '0.9rem' }}
          >
            ✎ Edit Profile
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn" 
              onClick={handleCancelClick}
              style={{ padding: '10px 20px', fontSize: '0.9rem', background: '#e5e7eb', color: '#374151' }}
            >
              Cancel
            </button>
            <button 
              className="btn primary" 
              type="submit"
              form="profile-form"
              disabled={profileLoading}
              style={{ padding: '10px 20px', fontSize: '0.9rem' }}
            >
              {profileLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {profileLoading && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#5b6b6d' }}>
          Loading profile...
        </div>
      )}

      {profileMessage && (
        <div style={{ padding: '14px', background: 'rgba(127, 199, 74, 0.15)', border: '1px solid rgba(127, 199, 74, 0.4)', borderRadius: '14px', color: '#2f7b3b', marginBottom: '16px', fontWeight: '600' }}>
          {profileMessage}
        </div>
      )}

      {profileError && (
        <div style={{ padding: '14px', background: 'rgba(230, 90, 85, 0.12)', border: '1px solid rgba(230, 90, 85, 0.35)', borderRadius: '14px', color: '#b92c2c', marginBottom: '16px' }}>
          {profileError}
        </div>
      )}

      <form className="settings-form" onSubmit={handleSaveProfile}>
        {/* Personal Information */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1d2b4a', marginBottom: '14px', borderBottom: '2px solid rgba(127, 199, 74, 0.2)', paddingBottom: '8px' }}>Personal Information</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="form-row">
              <label>First Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileForm.first_name}
                  onChange={(e) => handleProfileChange('first_name', e.target.value)}
                  required
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.first_name || 'Not provided'}
                </div>
              )}
            </div>
            <div className="form-row">
              <label>Middle Name</label>
{isEditing ? (
                <input
                  type="text"
                  value={profileForm.middle_name}
                  onChange={(e) => handleProfileChange('middle_name', e.target.value)}
                />
              ) : profileForm.middle_name ? (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.middle_name}
                </div>
              ) : null}
            </div>
            <div className="form-row">
              <label>Last Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileForm.last_name}
                  onChange={(e) => handleProfileChange('last_name', e.target.value)}
                  required
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.last_name || 'Not provided'}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '14px' }}>
            <div className="form-row">
              <label>Date of Birth</label>
              {isEditing ? (
                <input
                  type="date"
                  value={profileForm.dob}
                  onChange={(e) => handleProfileChange('dob', e.target.value)}
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.dob ? new Date(profileForm.dob).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not provided'}
                </div>
              )}
            </div>
            <div className="form-row">
              <label>Age</label>
              {isEditing ? (
                <input
                  type="number"
                  value={profileForm.age}
                  onChange={(e) => handleProfileChange('age', e.target.value)}
                  min="6"
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.age ? `${profileForm.age} years` : 'Not provided'}
                </div>
              )}
            </div>
            <div className="form-row">
              <label>Place of Birth</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileForm.pob}
                  onChange={(e) => handleProfileChange('pob', e.target.value)}
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.pob || 'Not provided'}
                </div>
              )}
            </div>
          </div>

          <div className="form-row" style={{ marginTop: '14px' }}>
            <label>Nationality</label>
            {isEditing ? (
              <input
                type="text"
                value={profileForm.nationality}
                onChange={(e) => handleProfileChange('nationality', e.target.value)}
              />
            ) : (
              <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                {profileForm.nationality || 'Not provided'}
              </div>
            )}
          </div>

          <div className="form-row" style={{ marginTop: '14px' }}>
            <label>Address</label>
            {isEditing ? (
              <input
                type="text"
                value={profileForm.address}
                onChange={(e) => handleProfileChange('address', e.target.value)}
                style={{ minHeight: '60px' }}
              />
            ) : (
              <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500', whiteSpace: 'pre-wrap' }}>
                {profileForm.address || 'Not provided'}
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1d2b4a', marginBottom: '14px', borderBottom: '2px solid rgba(127, 199, 74, 0.2)', paddingBottom: '8px' }}>Contact Information</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="form-row">
              <label>Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  required
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.email || 'Not provided'}
                </div>
              )}
            </div>
            <div className="form-row">
              <label>Parent Contact</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileForm.contact}
                  onChange={(e) => handleProfileChange('contact', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  required
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.contact || 'Not provided'}
                </div>
              )}
            </div>
            <div className="form-row">
              <label>Second Parent Contact</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileForm.parent_contact_2}
                  onChange={(e) => handleProfileChange('parent_contact_2', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.parent_contact_2 || 'Not provided'}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '14px' }}>
            <div className="form-row">
              <label>WhatsApp Number</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileForm.whatsapp}
                  onChange={(e) => handleProfileChange('whatsapp', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                  required
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.whatsapp || 'Not provided'}
                </div>
              )}
            </div>
            <div className="form-row">
              <label>Student Contact</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profileForm.student_contact}
                  onChange={(e) => handleProfileChange('student_contact', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  maxLength={10}
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.student_contact || 'Not provided'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1d2b4a', marginBottom: '14px', borderBottom: '2px solid rgba(127, 199, 74, 0.2)', paddingBottom: '8px' }}>Academic Information</h3>
          
          <div className="form-row">
            <label>School/College Name</label>
            {isEditing ? (
              <input
                type="text"
                value={profileForm.school}
                onChange={(e) => handleProfileChange('school', e.target.value)}
                required
              />
            ) : (
              <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                {profileForm.school || 'Not provided'}
              </div>
            )}
          </div>

          <div className="form-row" style={{ marginTop: '14px' }}>
            <label>Branch</label>
            {isEditing ? (
              <input
                type="text"
                value={profileForm.branch}
                onChange={(e) => handleProfileChange('branch', e.target.value)}
              />
            ) : (
              <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                {profileForm.branch || 'Not provided'}
              </div>
            )}
          </div>

          <div className="form-row" style={{ marginTop: '14px' }}>
            <label>Class/Course</label>
            {isEditing ? (
              <input
                type="text"
                value={profileForm.class}
                onChange={(e) => handleProfileChange('class', e.target.value)}
              />
            ) : (
              <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                {profileForm.class || 'Not provided'}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginTop: '14px' }}>
            <div className="form-row">
              <label>Previous Year %</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileForm.prev_percent}
                  onChange={(e) => handleProfileChange('prev_percent', e.target.value)}
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.prev_percent ? `${profileForm.prev_percent}%` : 'Not provided'}
                </div>
              )}
            </div>
            <div className="form-row">
              <label>Present Year %</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileForm.present_percent}
                  onChange={(e) => handleProfileChange('present_percent', e.target.value)}
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.present_percent ? `${profileForm.present_percent}%` : 'Not provided'}
                </div>
              )}
            </div>
          </div>

          <div className="form-row" style={{ marginTop: '14px' }}>
            <label>Academic Achievements</label>
            {isEditing ? (
              <input
                type="text"
                value={profileForm.academic_achievements}
                onChange={(e) => handleProfileChange('academic_achievements', e.target.value)}
                style={{ minHeight: '60px' }}
              />
            ) : (
              <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500', whiteSpace: 'pre-wrap' }}>
                {profileForm.academic_achievements || 'Not provided'}
              </div>
            )}
          </div>

          <div className="form-row" style={{ marginTop: '14px' }}>
            <label>Non-Academic Achievements</label>
            {isEditing ? (
              <input
                type="text"
                value={profileForm.non_academic_achievements}
                onChange={(e) => handleProfileChange('non_academic_achievements', e.target.value)}
                style={{ minHeight: '60px' }}
              />
            ) : (
              <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500', whiteSpace: 'pre-wrap' }}>
                {profileForm.non_academic_achievements || 'Not provided'}
              </div>
            )}
          </div>
        </div>

        {/* Educational Expenses */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1d2b4a', marginBottom: '14px', borderBottom: '2px solid rgba(127, 199, 74, 0.2)', paddingBottom: '8px' }}>Educational Expenses</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
            {Object.entries(profileForm.educational_expenses).map(([key, expense]) => (
              <div
                key={key}
                style={{
                  padding: '12px',
                  border: `1px solid ${expense.checked ? 'rgba(127, 199, 74, 0.4)' : 'rgba(46, 46, 46, 0.15)'}`,
                  borderRadius: '12px',
                  background: expense.checked ? 'rgba(127, 199, 74, 0.08)' : '#ffffff',
                  opacity: isEditing ? 1 : 0.6
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: isEditing ? 'pointer' : 'default' }}>
                  {isEditing ? (
                    <input
                      type="checkbox"
                      checked={expense.checked}
                      onChange={(e) => handleEducationalExpenseChange(key, 'checked', e.target.checked)}
                      style={{ width: 'auto' }}
                    />
                  ) : null}
                  <span style={{ fontWeight: '600', textTransform: 'capitalize', fontSize: '0.9rem' }}>
                    {key.replace(/_/g, ' ')}
                  </span>
                </label>
                {expense.checked && (
                  <input
                    type="number"
                    value={expense.amount}
                    onChange={(e) => handleEducationalExpenseChange(key, 'amount', e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter amount"
                    disabled={!isEditing}
                    style={{ width: '100%', marginTop: '8px' }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Family Details */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1d2b4a', marginBottom: '14px', borderBottom: '2px solid rgba(127, 199, 74, 0.2)', paddingBottom: '8px' }}>Family Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="form-row">
              <label>Number of Family Members</label>
              {isEditing ? (
                <input
                  type="number"
                  value={profileForm.num_family_members}
                  onChange={(e) => {
                    const num = parseInt(e.target.value) || 0;
                    handleProfileChange('num_family_members', e.target.value);
                    const newDetails = [...profileForm.family_members_details];
                    while (newDetails.length < num) newDetails.push({ name: '', relation: '' });
                    while (newDetails.length > num) newDetails.pop();
                    handleProfileChange('family_members_details', newDetails);
                  }}
                  min="0"
                  max="15"
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.num_family_members || '0'}
                </div>
              )}
            </div>
            <div className="form-row">
              <label>Number of Earning Members</label>
              {isEditing ? (
                <input
                  type="number"
                  value={profileForm.num_earning_members}
                  onChange={(e) => {
                    const num = parseInt(e.target.value) || 0;
                    handleProfileChange('num_earning_members', e.target.value);
                    const newDetails = [...profileForm.earning_members_details];
                    while (newDetails.length < num) newDetails.push({ name: '', occupation: '' });
                    while (newDetails.length > num) newDetails.pop();
                    handleProfileChange('earning_members_details', newDetails);
                  }}
                  min="0"
                  max="10"
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.num_earning_members || '0'}
                </div>
              )}
            </div>
          </div>

          {/* Family Members Details */}
          {profileForm.family_members_details.length > 0 && (
            <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(127, 199, 74, 0.08)', borderRadius: '12px' }}>
              <h4 style={{ fontSize: '1rem', color: '#1d2b4a', marginBottom: '12px' }}>Family Members</h4>
              {profileForm.family_members_details.map((member, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-row">
                    <label>Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleFamilyMemberChange(index, 'name', e.target.value)}
                        placeholder="Family member name"
                      />
                    ) : (
                      <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                        {member.name || 'Not provided'}
                      </div>
                    )}
                  </div>
                  <div className="form-row">
                    <label>Relation</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={member.relation}
                        onChange={(e) => handleFamilyMemberChange(index, 'relation', e.target.value)}
                        placeholder="Relationship with student"
                      />
                    ) : (
                      <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                        {member.relation || 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Earning Members Details */}
          {profileForm.earning_members_details.length > 0 && (
            <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(127, 199, 74, 0.08)', borderRadius: '12px' }}>
              <h4 style={{ fontSize: '1rem', color: '#1d2b4a', marginBottom: '12px' }}>Earning Members</h4>
              {profileForm.earning_members_details.map((member, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div className="form-row">
                    <label>Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={member.name}
                        onChange={(e) => handleEarningMemberChange(index, 'name', e.target.value)}
                        placeholder="Earning member name"
                      />
                    ) : (
                      <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                        {member.name || 'Not provided'}
                      </div>
                    )}
                  </div>
                  <div className="form-row">
                    <label>Occupation</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={member.occupation}
                        onChange={(e) => handleEarningMemberChange(index, 'occupation', e.target.value)}
                        placeholder="Occupation"
                      />
                    ) : (
                      <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                        {member.occupation || 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Other Details */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1d2b4a', marginBottom: '14px', borderBottom: '2px solid rgba(127, 199, 74, 0.2)', paddingBottom: '8px' }}>Other Details</h3>
          
          <div className="form-row">
            <label>Is she currently being raised by a single parent or guardian?</label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              {isEditing ? (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="is_single_parent"
                      value="YES"
                      checked={profileForm.is_single_parent === 'YES'}
                      onChange={(e) => handleProfileChange('is_single_parent', e.target.value)}
                      style={{ width: 'auto' }}
                    />
                    Yes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="is_single_parent"
                      value="NO"
                      checked={profileForm.is_single_parent === 'NO'}
                      onChange={(e) => handleProfileChange('is_single_parent', e.target.value)}
                      style={{ width: 'auto' }}
                    />
                    No
                  </label>
                </>
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.is_single_parent || 'Not provided'}
                </div>
              )}
            </div>
          </div>

          <div className="form-row" style={{ marginTop: '14px' }}>
            <label>Does she work to support her family?</label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              {isEditing ? (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="does_work"
                      value="YES"
                      checked={profileForm.does_work === 'YES'}
                      onChange={(e) => handleProfileChange('does_work', e.target.value)}
                      style={{ width: 'auto' }}
                    />
                    Yes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="does_work"
                      value="NO"
                      checked={profileForm.does_work === 'NO'}
                      onChange={(e) => handleProfileChange('does_work', e.target.value)}
                      style={{ width: 'auto' }}
                    />
                    No
                  </label>
                </>
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.does_work || 'Not provided'}
                </div>
              )}
            </div>
          </div>

          {profileForm.does_work === 'YES' && (
            <div className="form-row" style={{ marginTop: '14px' }}>
              <label>What kind of job does she do?</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileForm.job}
                  onChange={(e) => handleProfileChange('job', e.target.value)}
                  placeholder="Describe occupation"
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500', whiteSpace: 'pre-wrap' }}>
                  {profileForm.job || 'Not provided'}
                </div>
              )}
            </div>
          )}

          <div className="form-row" style={{ marginTop: '14px' }}>
            <label>Is she getting any scholarship / Govt help / financial assistance?</label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              {isEditing ? (
                <>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="has_scholarship"
                      value="YES"
                      checked={profileForm.has_scholarship === 'YES'}
                      onChange={(e) => handleProfileChange('has_scholarship', e.target.value)}
                      style={{ width: 'auto' }}
                    />
                    Yes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="has_scholarship"
                      value="NO"
                      checked={profileForm.has_scholarship === 'NO'}
                      onChange={(e) => handleProfileChange('has_scholarship', e.target.value)}
                      style={{ width: 'auto' }}
                    />
                    No
                  </label>
                </>
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.has_scholarship || 'Not provided'}
                </div>
              )}
            </div>
          </div>

          {profileForm.has_scholarship === 'YES' && (
            <div className="form-row" style={{ marginTop: '14px' }}>
              <label>Scholarship / Assistance Details</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileForm.scholarship}
                  onChange={(e) => handleProfileChange('scholarship', e.target.value)}
                  placeholder="Enter scholarship details"
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500', whiteSpace: 'pre-wrap' }}>
                  {profileForm.scholarship || 'Not provided'}
                </div>
              )}
            </div>
          )}

          <div className="form-row" style={{ marginTop: '14px' }}>
            <label>Career Aspirations</label>
            {isEditing ? (
              <input
                type="text"
                value={profileForm.aspiration}
                onChange={(e) => handleProfileChange('aspiration', e.target.value)}
                placeholder="Career aspirations and planned courses"
                style={{ minHeight: '60px' }}
              />
            ) : (
              <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500', whiteSpace: 'pre-wrap' }}>
                {profileForm.aspiration || 'Not provided'}
              </div>
            )}
          </div>

          <div className="form-row" style={{ marginTop: '14px' }}>
            <label>Special Remarks</label>
            {isEditing ? (
              <input
                type="text"
                value={profileForm.special_remarks}
                onChange={(e) => handleProfileChange('special_remarks', e.target.value)}
                placeholder="Any additional notes"
                style={{ minHeight: '60px' }}
              />
            ) : (
              <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500', whiteSpace: 'pre-wrap' }}>
                {profileForm.special_remarks || 'Not provided'}
              </div>
            )}
          </div>
        </div>

        {/* Bank Details */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#1d2b4a', marginBottom: '14px', borderBottom: '2px solid rgba(127, 199, 74, 0.2)', paddingBottom: '8px' }}>Bank Account Details</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="form-row">
              <label>Account Number</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileForm.account_no}
                  onChange={(e) => handleProfileChange('account_no', e.target.value.replace(/\D/g, '').slice(0, 18))}
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.account_no || 'Not provided'}
                </div>
              )}
            </div>
            <div className="form-row">
              <label>Bank Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileForm.bank_name}
                  onChange={(e) => handleProfileChange('bank_name', e.target.value)}
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.bank_name || 'Not provided'}
                </div>
              )}
            </div>
            <div className="form-row">
              <label>Branch</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileForm.bank_branch}
                  onChange={(e) => handleProfileChange('bank_branch', e.target.value)}
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.bank_branch || 'Not provided'}
                </div>
              )}
            </div>
            <div className="form-row">
              <label>IFSC Code</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileForm.ifsc_code}
                  onChange={(e) => handleProfileChange('ifsc_code', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11))}
                />
              ) : (
                <div style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: '14px', border: '1px solid rgba(46, 46, 46, 0.1)', color: '#1d2b4a', fontWeight: '500' }}>
                  {profileForm.ifsc_code || 'Not provided'}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn primary" type="submit" disabled={profileLoading}>
            {profileLoading ? 'Updating...' : 'Update Profile'}
          </button>
          {profileMessage && <span className="success-text">{profileMessage}</span>}
          {profileError && <span style={{ color: '#b92c2c', fontWeight: '600' }}>{profileError}</span>}
        </div>
      </form>
    </div>
  );

  const renderOverview = () => (
    <>
      <div className="section-header">
        <div>
          <h2>Dashboard Overview</h2>
          <p className="section-note">Quick summary of your documents and recent alerts.</p>
        </div>
      </div>

      {renderStatsBar()}

      <div className="section-block">
        <div className="section-header">
          <h3>Recent Alerts</h3>
          <p className="section-note">Tap to mark as read and keep up to date.</p>
        </div>
        {renderNotificationFilters()}
        {renderNotifications()}
      </div>

      <div className="section-block">
        <div className="section-header">
          <h3>Recent Documents</h3>
          <p className="section-note">Latest uploads and their verification status.</p>
        </div>
        {renderDocumentUpload()}
      </div>
    </>
  );

  const renderMainContent = () => {
    if (activeNav === "documents") {
      return (
        <>
          <div className="section-header">
            <h2>Upload Documents</h2>
            <span className="section-note">Keep your documents up to date for verification.</span>
          </div>
          {renderDocumentUpload()}
        </>
      );
    }

    if (activeNav === "notifications") {
      return (
        <>
          <div className="section-header">
            <h2>Alerts & Reminders</h2>
            <span className="section-note">Tap a notification to mark it as read.</span>
          </div>
          {renderNotificationFilters()}
          {renderNotifications()}
        </>
      );
    }

    if (activeNav === "settings") {
      return renderSettings();
    }

    if (activeNav === "profile") {
      return renderProfile();
    }

    return renderOverview();
  };

  return (
    <div className="student-root">
      {renderSidebar()}
      <main className="student-main">
        <header className="student-main-header">
          <div>
            <h1>Welcome back, {profile.name || "Scholar"}</h1>
            <p className="subtle">Your dashboard for managing scholarship documents and alerts.</p>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <section className="content-area">{renderMainContent()}</section>
      </main>
    </div>
  );
};
export default StudentDashboard;

