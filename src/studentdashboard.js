import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./studentdashboard.css";
import { useNavigate } from "react-router-dom";
import supabase from "./supabaseClient";
import EducationDropdown from "./EducationDropdown";
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
  { key: "academic", title: "Academic Documents", icon: "📚" },
  { key: "fee", title: "Fee Receipts", icon: "💰" },
  { key: "personal", title: "Personal Documents", icon: "🆔" },
  { key: "extracurricular", title: "Extracurricular", icon: "🏆" },
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

  const [profile, setProfile] = useState({});
  const [notifications, setNotifications] = useState([]);
  // notifFilter state removed
  const [documents, setDocuments] = useState(initialDocumentState);

  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(""); // Fix: Define missing setError
  const [settings, setSettings] = useState({
    newPassword: "",
    confirmPassword: ""
  });
const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [studentId, setStudentId] = useState(null);
  const [studentFormId, setStudentFormId] = useState(null);
  const [formIdLoading, setFormIdLoading] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [documentNames, setDocumentNames] = useState(DOCUMENT_CATEGORIES.reduce((acc, cat) => {
    acc[cat.key] = '';
    return acc;
  }, {}));

  const [academicEducation, setAcademicEducation] = useState({
    educationcategory: '',
    educationsubcategory: '',
    educationyear: '',
    educationcategory_custom: '',
    educationsubcategory_custom: '',
    educationyear_custom: ''
  });

  const [personalDropdown, setPersonalDropdown] = useState('');
  const [studentType, setStudentType] = useState(null);
  const { studentEmail, logout: contextLogout } = useStudent();

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
  const [profileTab, setProfileTab] = useState('personal');

  const PROFILE_TABS = [
    { key: 'personal', label: 'Personal Info' },
    { key: 'contact', label: 'Contact' },
    { key: 'academic', label: 'Academic' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'family', label: 'Family' },
    { key: 'other', label: 'Other Details' }
  ];

  const fetchProfileFormData = useCallback(async () => {
    if (!studentEmail) return;

    setProfileLoading(true);
    try {
      const { data: formData, error } = await supabase
        .from('student_form_submissions')
        .select('*')
        .eq('email', studentEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile form:', error);
        return;
      }

      if (formData) {
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
          special_remarks: formData.special_remarks || '',
          academic_achievements: formData.academic_achievements || '',
          non_academic_achievements: formData.non_academic_achievements || '',
          is_single_parent: formData.is_single_parent ? 'YES' : 'NO',
          does_work: formData.does_work ? 'YES' : 'NO',
          has_scholarship: formData.has_scholarship ? 'YES' : 'NO'
        };
        setProfileForm(mappedData);
        setOriginalFormData(mappedData);
      }
    } catch (err) {
      console.error('Error in fetchProfileFormData:', err);
    } finally {
      setProfileLoading(false);
    }
  }, [studentEmail]);

  useEffect(() => {
    fetchProfileFormData();
  }, [fetchProfileFormData, studentEmail]);

  const fetchDocuments = useCallback(async () => {
    if (!studentFormId) return;
    setLoadingDocuments(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', studentFormId)
        .order('uploaded_at', { ascending: false });
      if (error) throw error;

      const grouped = DOCUMENT_CATEGORIES.reduce((acc, cat) => {
        acc[cat.key] = data.filter(doc => doc.category === cat.key);
        return acc;
      }, {});
      setDocuments(grouped);
    } catch (err) {
      setError('Failed to fetch documents: ' + err.message);
    } finally {
      setLoadingDocuments(false);
    }
  }, [studentFormId]);

  useEffect(() => {
    fetchDocuments();
  }, [studentFormId, fetchDocuments]);

  const handleDeleteDocument = async (docId) => {
    console.log('🔥 DEBUG DELETE START:', docId);
if (!window.confirm('DELETE? (Check F12 Console)')) return;

    try {
      // 1. GET DOC
      const { data: doc, error: getError } = await supabase
        .from('student_documents')
        .select('*, student_id')
        .eq('id', docId)
        .single();
      console.log('📄 DOC:', doc);
      console.log('GET ERROR:', getError);
      if (getError || !doc) {
        console.log('❌ NO DOC');
        alert('No document');
        return;
      }

      // 2. STUDENT FORM ID MATCH?
      const { data: form } = await supabase
        .from('student_form_submissions')
        .select('id')
        .eq('email', studentEmail)
        .single();
      console.log('STUDENT FORM:', form);
      console.log('MATCH?', form?.id === doc.student_id);

      // 3. STORAGE DELETE
      if (doc.file_url) {
        const path = doc.file_url.split('/student_documents/')[1];
        if (path) {
          const { error } = await supabase.storage.from('student_documents').remove([path]);
          console.log('STORAGE:', path, error);
        }
      }

      // 4. DB DELETE with count
      // 4. DB DELETE - simple no count (count() may fail in some Supabase)
      const { error: dbError } = await supabase
        .from('student_documents')
        .delete()
        .eq('id', docId);
      console.log('🚫 DB ERROR:', dbError);
      console.log('FULL DOC BEFORE:', doc);

      if (dbError) {
        alert(`DB Error: ${dbError.message}`);
        return;
      }

      // Check if actually deleted
      const { data: check } = await supabase
        .from('student_documents')
        .select('*')
        .eq('id', docId)
        .single();
      console.log('DOC AFTER DELETE:', check);

      if (check) {
        alert('Delete failed - doc still exists!');
        return;
      }

      // Success
      await fetchDocuments();
      alert('✅ Document deleted!');


    } catch (err) {
      console.error('💥 TOTAL FAIL:', err);
      alert('FAILED');
    }
  };

  useEffect(() => {
    let subscription;

    const init = async () => {
      if (!studentEmail) return;
      
      const { data: profileData, error: profileError } = await supabase
        .from('eligible_students')
        .select('*')
        .eq('email', studentEmail)
        .single();
      
      if (profileError || !profileData) {
        const { data: nonEligibleData, error: nonError } = await supabase
          .from('non_eligible_students')
          .select('*')
          .eq('email', studentEmail)
          .single();
        if (nonError || !nonEligibleData) return;
        setProfile(nonEligibleData);
        setStudentId(nonEligibleData.id);
      } else {
        setProfile(profileData);
        setStudentId(profileData.id);
      }

      // Fetch student_form_submissions ID for documents (retry logic)
      const fetchFormId = async () => {
        console.log('[DASHBOARD] Fetching studentFormId for email:', studentEmail);
        try {
          // 1. Try student_form_submissions (pending forms)
          let { data: formData, error } = await supabase
            .from('student_form_submissions')
            .select('id')
            .eq('email', studentEmail)
            .single();

          if (!formData) {
            console.log('[DASHBOARD] No pending form, checking eligible_students');
            // 2. Fallback to eligible_students
            ({ data: formData, error } = await supabase
              .from('eligible_students')
              .select('student_id')
              .eq('email', studentEmail)
              .single());
            if (formData) formData.id = formData.student_id;
          }

          if (!formData) {
            console.log('[DASHBOARD] No eligible, checking non_eligible_students');
            // 3. Fallback to non_eligible_students
            ({ data: formData, error } = await supabase
              .from('non_eligible_students')
              .select('student_id')
              .eq('email', studentEmail)
              .single());
            if (formData) formData.id = formData.student_id;
          }

          console.log('[DASHBOARD] Final formData:', formData);
          if (formData?.id) {
            setStudentFormId(formData.id);
          } else {
            console.warn('[DASHBOARD] No form found for', studentEmail);
          }
        } catch (err) {
          console.error('[DASHBOARD] fetchFormId error:', err);
        } finally {
          setFormIdLoading(false);
        }
      };
      await fetchFormId();

      setSettings({
        name: profileData?.full_name || '',
        email: profileData?.email || '',
        phone: profileData?.phone || ''
      });
      
      const type = await getStudentType(studentId);
      setStudentType(type);
      
      const res = await getStudentNotifications(type);
      if (res.success) {
        setNotifications(res.notifications);
      }
      
      subscription = subscribeToNotifications((newData) => {
        if (!studentType) return;
        if (filterNotification(newData, studentType)) {
          setNotifications(prev => {
            const exists = prev.some(n => n.id === newData.id);
            if (exists) return prev;
            return [newData, ...prev];
          });
        }
      });
    };

    init();

    return () => {
      // Better cleanup - remove realtime subscription properly
      if (subscription) {
        supabase.removeChannel(subscription);
        subscription.unsubscribe();
      }
    };
  }, [studentEmail, supabase, getStudentNotifications, getStudentType, setProfile, setStudentId, setStudentFormId, setFormIdLoading, setSettings, setStudentType, setNotifications]);







  const handleSaveSettings = async () => {
    setSavingSettings(true);
    setError("");
    setSaveSuccess(false);

    if (settings.newPassword !== settings.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setSavingSettings(false);
      return;
    }

    try {
      // Call backend to update password
      const { error } = await supabase.auth.updateUser({
        password: settings.newPassword,
      });

      if (error) {
        throw error;
      }

      setSaveSuccess(true);
      setSettings({ newPassword: "", confirmPassword: "" });
    } catch (err) {
      setErrorMessage(err.message || "Failed to update password.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = () => {
    contextLogout();
    navigate('/studentlogin');
  };

const handleUpload = async (category, files, documentName) => {
  console.log('[UPLOAD] Starting upload:', { category, documentName: documentName?.trim(), studentFormId, studentEmail });
  
  if (!documentName?.trim()) {
    setError('Document name is required');
    return;
  }
  if (formIdLoading) {
    setError('Loading student profile... please wait');
    return;
  }
  if (!studentFormId) {
    setError('Student profile not found. Please complete student form first.');
    return;
  }

  // Validate files
  const validFiles = Array.from(files).filter(file => {
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff',
      // Documents
      'application/pdf',
      // CSV
      'text/csv', 'application/csv',
      // Excel
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      // JSON
      'application/json',
      // Word
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      // PowerPoint
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file type: ${file.name}. Allowed: PDF, JPG, PNG, GIF, WebP, CSV (.csv), Excel (.xlsx/.xls), JSON, Word (.docx/.doc), PowerPoint`);
      return false;
    }
    if (file.size > maxSize) {
      setError(`File too large: ${file.name} (${(file.size/1024/1024).toFixed(1)}MB). Max 10MB`);
      return false;
    }
    return true;
  });

  if (validFiles.length === 0) return;

  if (validFiles.length < files.length) {
    setError(`${files.length - validFiles.length} invalid files skipped`);
  }

  setError('');

  let successCount = 0;
  const tasks = validFiles.map(async (file) => {
    const id = `${category}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setUploadProgress(prev => ({ ...prev, [id]: { progress: 0, name: file.name, status: 'uploading' } }));

    try {
      // Better sanitization
      const safeEmail = studentEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const timestamp = Date.now();
      const filePath = `${safeEmail}/${category}/${timestamp}-${safeName}`;

      console.log('[UPLOAD] File path:', filePath);

      // Upload with progress if possible (Supabase supports it)
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('student_documents')
        .upload(filePath, file, { 
          cacheControl: '3600',
          upsert: false 
        });

      if (uploadError) {
        console.error('[UPLOAD]', uploadError);
        const msg = uploadError.message.includes('policy') ? 'Upload blocked by permissions. Check Supabase policies.' : uploadError.message;
        setUploadProgress(prev => ({ 
          ...prev, 
          [id]: { ...prev[id], progress: 0, error: msg, status: 'error' } 
        }));
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('student_documents')
        .getPublicUrl(filePath);

      // Insert to DB
      const { error: insertError, data: insertData } = await supabase
        .from('student_documents')
        .insert({
          student_id: studentFormId,
          category,
          document_name: documentName,
          file_name: file.name,
          file_url: publicUrl,
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('[UPLOAD] DB insert:', insertError);
        const msg = insertError.message.includes('policy') ? 'Database save blocked. Check table policies.' : insertError.message;
        setUploadProgress(prev => ({ 
          ...prev, 
          [id]: { ...prev[id], progress: 0, error: msg, status: 'error' } 
        }));
        // Don't delete storage file if DB fails
        return null;
      }

      successCount++;
      console.log('[UPLOAD] Success:', insertData.id);
      setUploadProgress(prev => ({ 
        ...prev, 
        [id]: { ...prev[id], progress: 100, status: 'success' } 
      }));

      // Optimistic refresh
      fetchDocuments();
      return insertData;
    } catch (err) {
      console.error('[UPLOAD] Unexpected error:', err);
      setUploadProgress(prev => ({ 
        ...prev, 
        [id]: { ...prev[id], progress: 0, error: err.message, status: 'error' } 
      }));
      return null;
    }
  });

  try {
    await Promise.all(tasks);
    if (successCount > 0) {
      setSuccessMessage(`${successCount} file(s) uploaded successfully!`);
      setDocumentNames(prev => ({ ...prev, [category]: '' }));
      // Clear success after 5s
      setTimeout(() => setSuccessMessage(''), 5000);
    }
    setError('');
  } catch (err) {
    setError('Upload process failed');
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
      const fullName = `${profileForm.first_name} ${profileForm.middle_name || ''} ${profileForm.last_name}`.trim();
      
      // First, get the ID from student_form_submissions to ensure we update the correct record
      const { data: existingRecord, error: fetchError } = await supabase
        .from('student_form_submissions')
        .select('id')
        .eq('email', studentEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) {
        console.error('[PROFILE] Error fetching existing record:', fetchError);
        throw new Error('Failed to fetch existing record');
      }

      if (!existingRecord) {
        console.error('[PROFILE] No record found for email:', studentEmail);
        throw new Error('No existing record found to update');
      }

      const recordId = existingRecord.id;
      console.log('[PROFILE] Found student_form_submissions record with ID:', recordId);

      // Update ONLY student_form_submissions table using the ID (primary key)
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
fee: parseFloat(profileForm.fee) || null,        educational_expenses: profileForm.educational_expenses,
        job: profileForm.job || null,
        aspiration: profileForm.aspiration || null,
        scholarship: profileForm.scholarship || null,
        num_family_members: parseInt(profileForm.num_family_members) || 0,
        family_members_details: profileForm.family_members_details,
        earning_members: parseInt(profileForm.num_earning_members) || 0,
        earning_members_details: profileForm.earning_members_details,

        special_remarks: profileForm.special_remarks || null,
        academic_achievements: profileForm.academic_achievements || null,
        non_academic_achievements: profileForm.non_academic_achievements || null,
        is_single_parent: profileForm.is_single_parent === 'YES',
        does_work: profileForm.does_work === 'YES',
        has_scholarship: profileForm.has_scholarship === 'YES'
      };

      console.log('[PROFILE] Updating student_form_submissions with ID:', recordId);
      
      // Update ONLY student_form_submissions using ID (primary key)
      const { error: submissionError } = await supabase
        .from('student_form_submissions')
        .update(formSubmissionUpdate)
        .eq('id', recordId);

      if (submissionError) {
        console.error('[PROFILE] Error updating student_form_submissions:', submissionError);
        throw submissionError;
      }

      console.log('[PROFILE] Successfully updated student_form_submissions record ID:', recordId);

      setProfileMessage('Profile updated successfully!');
      setIsEditing(false); // Exit edit mode after successful save
      
      // Update profile context
      setProfile(prev => ({ ...prev, full_name: fullName, student_name: fullName, contact: profileForm.contact }));
      
      // Reload the profile form data from database to show updated values
      await fetchProfileFormData();
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };



  const totalNotifications = notifications.length;

  const filteredNotifications = useMemo(() => [...notifications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)), [notifications]);

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
      <StatCard icon="🔔" label="Notifications" value={totalNotifications} />
    </div>
  );

  // renderNotificationFilters removed

  const renderNotifications = () => {
    if (!filteredNotifications.length) {
      return <div className="empty-state">No notifications available.</div>;
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
                <p className="doc-subtitle">Upload</p>
              </div>
              <div className="upload-section">
{category.key === 'academic' ? (
                  <EducationDropdown
                    educationcategory={academicEducation.educationcategory}
                    educationsubcategory={academicEducation.educationsubcategory}
                    educationyear={academicEducation.educationyear}
                    educationcategory_custom={academicEducation.educationcategory_custom}
                    educationsubcategory_custom={academicEducation.educationsubcategory_custom}
                    educationyear_custom={academicEducation.educationyear_custom}
                    onChange={(e) => {
                      const { name, value } = e.target;
                      setAcademicEducation(prev => ({ ...prev, [name]: value }));
                      
                      // Generate document name e.g. "ENGINEERING CSE 1st Year"
                      const newState = { ...academicEducation, [name]: value };
                      const cat = newState.educationcategory || newState.educationcategory_custom;
                      const sub = newState.educationsubcategory || newState.educationsubcategory_custom;
                      const year = newState.educationyear || newState.educationyear_custom;
                      
                      if (cat) {
                        const docName = [cat, sub, year].filter(Boolean).join(' ');
                        setDocumentNames(prevNames => ({
                          ...prevNames,
                          [category.key]: docName
                        }));
                      }
                    }}
                  />
                ) : category.key === 'personal' ? (
                  <select 
                    value={personalDropdown}
                    onChange={(e) => {
                      setPersonalDropdown(e.target.value);
                      setDocumentNames(prev => ({ ...prev, personal: e.target.value }));
                    }}
                    className="doc-input"
                  >
                    <option value="">Select Personal Document</option>
                    <option value="Aadhar Card">Aadhar Card</option>
                    <option value="Bonified">Bonified</option>
                    <option value="Income Certificate">Income Certificate</option>
                  </select>
                ) : (
                  <input
                    placeholder={`Document name for ${category.title} (e.g., 10th Marksheet)`}
                    value={documentNames[category.key]}
                    onChange={(e) => setDocumentNames(prev => ({ ...prev, [category.key]: e.target.value }))}
                    className="doc-input"
                  />
                )}

                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const name = documentNames[category.key].trim();
                    if (e.target.files?.length) {
                      console.log('[UPLOAD UI] Triggered with name:', name || '(empty)');
                      if (name) {
                        handleUpload(category.key, e.target.files, name);
                      } else {
                        setError('Please enter a document name first');
                      }
                      e.target.value = null;
                    }
                  }}
                />
              </div>
            </div>

            {loadingDocuments ? (
              <div className="loading-state">Loading documents...</div>
            ) : !docs.length ? (
              <div className="empty-state">No documents uploaded yet.</div>
            ) : null}

{docs.map((doc) => (
              <div key={doc.id} className="doc-row">
                <div className="doc-meta">
                  {doc.document_name && (
                    <div className="doc-name bold">{doc.document_name}</div>
                  )}
                  <div className="doc-subtle">
                    {doc.file_name} • {doc.status || 'pending'} •{' '}
                    {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <div className="doc-actions">
                  {doc.file_url ? (
                    <a className="link" href={doc.file_url} target="_blank" rel="noreferrer">
                      View
                    </a>
                  ) : (
                    <span className="subtle">No URL</span>
                  )}
                  <button
                    className="icon-btn danger"
                    onClick={() => handleDeleteDocument(doc.id)}
                    aria-label="Delete document"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

{Object.entries(uploadProgress)
              .filter(([key]) => key.startsWith(category.key))
              .map(([key, progress]) => {
                // Auto-clear completed after 10s
                if (progress.status === 'success' || progress.status === 'error') {
                  setTimeout(() => {
                    setUploadProgress(prev => {
                      const newProgress = { ...prev };
                      delete newProgress[key];
                      return newProgress;
                    });
                  }, 10000);
                }
                
                return (
                  <div key={key} className={`upload-progress ${progress.status || ''}`}>
                    <div className="upload-meta">
                      <span>{progress.name}</span>
                      {progress.status === 'uploading' && <span>Uploading...</span>}
                      {progress.status === 'success' && <span className="upload-success">✅ Success</span>}
                      {progress.status === 'error' && <span className="upload-error">❌ {progress.error}</span>}
                      {progress.status !== 'uploading' && progress.status !== 'success' && progress.status !== 'error' && (
                        <span className="upload-percent">{progress.progress}%</span>
                      )}
                    </div>
                    {(progress.status === 'uploading' || !progress.status) && (
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
          </section>
        );
      })}
    </div>
  );

  const renderSettings = ({
    settings,
    setSettings,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    errorMessage,
    setErrorMessage,
    savingSettings,
    setSavingSettings,
    saveSuccess,
    setSaveSuccess,
  }) => {
    return (
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Student Settings</h2>
          <p className="section-note">Update your account settings and preferences.</p>
        </div>

        <div className="settings-form">
          <div className="form-group">
            <label>New Password</label>
            <div className="password-field">
              <input
                type={showNewPassword ? "text" : "password"}
                value={settings.newPassword}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                className="input-field modern-input"
                placeholder="Enter new password"
              />
              <span
                className={`eye-icon ${showNewPassword ? "eye-open" : "eye-closed"}`}
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label="Toggle password visibility"
                role="button"
              ></span>
            </div>
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <div className="password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={settings.confirmPassword}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                className="input-field modern-input"
                placeholder="Confirm new password"
              />
              <span
                className={`eye-icon ${showConfirmPassword ? "eye-open" : "eye-closed"}`}
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label="Toggle password visibility"
                role="button"
              ></span>
            </div>
          </div>

          {errorMessage && <p className="error-message">{errorMessage}</p>}

          <div className="form-actions">
            <button
              className="btn primary modern-btn"
              onClick={handleSaveSettings}
              disabled={savingSettings}
            >
              {savingSettings ? "Saving..." : "Save Settings"}
            </button>
            {saveSuccess && <p className="success-message">Settings saved successfully!</p>}
          </div>
        </div>
      </div>
    );
  };

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

      <div style={{ overflowX: 'auto', padding: '16px 0', marginBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', gap: '8px', whiteSpace: 'nowrap' }}>
          {PROFILE_TABS.map(tab => (
            <button
              key={tab.key}
              className={`profile-tab ${profileTab === tab.key ? 'active' : ''}`}
              onClick={() => setProfileTab(tab.key)}
              style={{
                padding: '10px 20px',
                border: 'none',
                background: profileTab === tab.key ? '#7fc74a' : 'transparent',
                color: profileTab === tab.key ? 'white' : '#6b7280',
                borderRadius: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
              onMouseOver={e => {
                if (profileTab !== tab.key) {
                  e.target.style.background = '#f3f4f6';
                  e.target.style.color = '#374151';
                }
              }}
              onMouseOut={e => {
                if (profileTab !== tab.key) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#6b7280';
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>


{profileTab === 'personal' && (
        <div className="profile-tab-content">
          {/* Personal Information */}
          <div className="profile-section">
            <h3 className="profile-section-title">Personal Information</h3>
            
            <div className="profile-grid">
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
                  <div className="view-value">
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
                  <div className="view-value">
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
                  <div className="view-value">
                    {profileForm.last_name || 'Not provided'}
                  </div>
                )}
              </div>
            </div>

            <div className="profile-grid">
              <div className="form-row">
                <label>Date of Birth</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={profileForm.dob}
                    onChange={(e) => handleProfileChange('dob', e.target.value)}
                  />
                ) : (
                  <div className="view-value">
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
                  <div className="view-value">
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
                  <div className="view-value">
                    {profileForm.pob || 'Not provided'}
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <label>Nationality</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileForm.nationality}
                  onChange={(e) => handleProfileChange('nationality', e.target.value)}
                />
              ) : (
                <div className="view-value">
                  {profileForm.nationality || 'Not provided'}
                </div>
              )}
            </div>

            <div className="form-row">
              <label>Address</label>
              {isEditing ? (
                <textarea
                  value={profileForm.address}
                  onChange={(e) => handleProfileChange('address', e.target.value)}
                  style={{ minHeight: '60px' }}
                />
              ) : (
                <div className="view-value multiline">
                  {profileForm.address || 'Not provided'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
{profileTab === 'contact' && (
        <div className="profile-tab-content">
          {/* Contact Information */}
          <div className="profile-section">
            <h3 className="profile-section-title">Contact Information</h3>
            
            <div className="profile-grid">
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
                  <div className="view-value">
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
                  <div className="view-value">
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
                    maxLength={10}
                  />
                ) : (
                  <div className="view-value">
                    {profileForm.parent_contact_2 || 'Not provided'}
                  </div>
                )}
              </div>
            </div>

            <div className="profile-grid">
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
                  <div className="view-value">
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
                  <div className="view-value">
                    {profileForm.student_contact || 'Not provided'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
{profileTab === 'academic' && (
        <div className="profile-tab-content">
          {/* Academic Information */}
          <div className="profile-section">
            <h3 className="profile-section-title">Academic Information</h3>
          
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
                <div className="view-value">
                  {profileForm.school || 'Not provided'}
                </div>
              )}
            </div>

            <div className="form-row">
              <label>Branch</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileForm.branch}
                  onChange={(e) => handleProfileChange('branch', e.target.value)}
                />
              ) : (
                <div className="view-value">
                  {profileForm.branch || 'Not provided'}
                </div>
              )}
            </div>

            <div className="form-row">
              <label>Class/Course</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profileForm.class}
                  onChange={(e) => handleProfileChange('class', e.target.value)}
                />
              ) : (
                <div className="view-value">
                  {profileForm.class || 'Not provided'}
                </div>
              )}
            </div>

            <div className="profile-grid">
              <div className="form-row">
                <label>Previous Year %</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileForm.prev_percent}
                    onChange={(e) => handleProfileChange('prev_percent', e.target.value)}
                  />
                ) : (
                  <div className="view-value">
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
                  <div className="view-value">
                    {profileForm.present_percent ? `${profileForm.present_percent}%` : 'Not provided'}
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <label>Academic Achievements</label>
              {isEditing ? (
                <textarea
                  value={profileForm.academic_achievements}
                  onChange={(e) => handleProfileChange('academic_achievements', e.target.value)}
                  style={{ minHeight: '60px' }}
                />
              ) : (
                <div className="view-value multiline">
                  {profileForm.academic_achievements || 'Not provided'}
                </div>
              )}
            </div>

            <div className="form-row">
              <label>Non-Academic Achievements</label>
              {isEditing ? (
                <textarea
                  value={profileForm.non_academic_achievements}
                  onChange={(e) => handleProfileChange('non_academic_achievements', e.target.value)}
                  style={{ minHeight: '60px' }}
                />
              ) : (
                <div className="view-value multiline">
                  {profileForm.non_academic_achievements || 'Not provided'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
{profileTab === 'expenses' && (
        <div className="profile-tab-content">
          {/* Educational Expenses */}
          <div className="profile-section">
            <h3 className="profile-section-title">Educational Expenses</h3>
          
            <div className="expenses-grid">
              {Object.entries(profileForm.educational_expenses).map(([key, expense]) => (
                <div
                  key={key}
                  className={`expense-item ${expense.checked ? 'active' : ''}`}
                >
                  <label className="expense-label">
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={expense.checked}
                        onChange={(e) => handleEducationalExpenseChange(key, 'checked', e.target.checked)}
                      />
                    ) : null}
                    <span>{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  </label>
                  {expense.checked && (
                    <input
                      type="number"
                      value={expense.amount}
                      onChange={(e) => handleEducationalExpenseChange(key, 'amount', e.target.value.replace(/\D/g, ''))}
                      placeholder="₹ Amount"
                      disabled={!isEditing}
                      className="expense-amount"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
{profileTab === 'family' && (
        <div className="profile-tab-content">
          {/* Family Details */}
          <div className="profile-section">
            <h3 className="profile-section-title">Family Details</h3>
          
            <div className="profile-grid">
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
                  <div className="view-value">
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
                  <div className="view-value">
                    {profileForm.num_earning_members || '0'}
                  </div>
                )}
              </div>
            </div>

            {/* Family Members Details */}
            {profileForm.family_members_details.length > 0 && (
              <div className="family-section">
                <h4>Family Members</h4>
                {profileForm.family_members_details.map((member, index) => (
                  <div key={index} className="profile-grid">
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
                        <div className="view-value">
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
                        <div className="view-value">
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
              <div className="family-section">
                <h4>Earning Members</h4>
                {profileForm.earning_members_details.map((member, index) => (
                  <div key={index} className="profile-grid">
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
                        <div className="view-value">
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
                        <div className="view-value">
                          {member.occupation || 'Not provided'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
{profileTab === 'other' && (
        <div className="profile-tab-content">
          {/* Other Details */}
          <div className="profile-section">
            <h3 className="profile-section-title">Other Details</h3>
          
            <div className="radio-group">
              <label>Is she currently being raised by a single parent or guardian?</label>
              <div className="radio-options">
                {isEditing ? (
                  <>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="is_single_parent"
                        value="YES"
                        checked={profileForm.is_single_parent === 'YES'}
                        onChange={(e) => handleProfileChange('is_single_parent', e.target.value)}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="is_single_parent"
                        value="NO"
                        checked={profileForm.is_single_parent === 'NO'}
                        onChange={(e) => handleProfileChange('is_single_parent', e.target.value)}
                      />
                      <span>No</span>
                    </label>
                  </>
                ) : (
                  <div className="view-value">
                    {profileForm.is_single_parent || 'Not provided'}
                  </div>
                )}
              </div>
            </div>

            <div className="radio-group">
              <label>Does she work to support her family?</label>
              <div className="radio-options">
                {isEditing ? (
                  <>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="does_work"
                        value="YES"
                        checked={profileForm.does_work === 'YES'}
                        onChange={(e) => handleProfileChange('does_work', e.target.value)}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="does_work"
                        value="NO"
                        checked={profileForm.does_work === 'NO'}
                        onChange={(e) => handleProfileChange('does_work', e.target.value)}
                      />
                      <span>No</span>
                    </label>
                  </>
                ) : (
                  <div className="view-value">
                    {profileForm.does_work || 'Not provided'}
                  </div>
                )}
              </div>
            </div>

            {profileForm.does_work === 'YES' && (
              <div className="form-row">
                <label>What kind of job does she do?</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileForm.job}
                    onChange={(e) => handleProfileChange('job', e.target.value)}
                    placeholder="Describe occupation"
                  />
                ) : (
                  <div className="view-value multiline">
                    {profileForm.job || 'Not provided'}
                  </div>
                )}
              </div>
            )}

            <div className="radio-group">
              <label>Is she getting any scholarship / Govt help / financial assistance?</label>
              <div className="radio-options">
                {isEditing ? (
                  <>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="has_scholarship"
                        value="YES"
                        checked={profileForm.has_scholarship === 'YES'}
                        onChange={(e) => handleProfileChange('has_scholarship', e.target.value)}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        name="has_scholarship"
                        value="NO"
                        checked={profileForm.has_scholarship === 'NO'}
                        onChange={(e) => handleProfileChange('has_scholarship', e.target.value)}
                      />
                      <span>No</span>
                    </label>
                  </>
                ) : (
                  <div className="view-value">
                    {profileForm.has_scholarship || 'Not provided'}
                  </div>
                )}
              </div>
            </div>

            {profileForm.has_scholarship === 'YES' && (
              <div className="form-row">
                <label>Scholarship / Assistance Details</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileForm.scholarship}
                    onChange={(e) => handleProfileChange('scholarship', e.target.value)}
                    placeholder="Enter scholarship details"
                  />
                ) : (
                  <div className="view-value multiline">
                    {profileForm.scholarship || 'Not provided'}
                  </div>
                )}
              </div>
            )}

            <div className="form-row">
              <label>Career Aspirations</label>
              {isEditing ? (
                <textarea
                  value={profileForm.aspiration}
                  onChange={(e) => handleProfileChange('aspiration', e.target.value)}
                  placeholder="Career aspirations and planned courses"
                  style={{ minHeight: '60px' }}
                />
              ) : (
                <div className="view-value multiline">
                  {profileForm.aspiration || 'Not provided'}
                </div>
              )}
            </div>

            <div className="form-row">
              <label>Special Remarks</label>
              {isEditing ? (
                <textarea
                  value={profileForm.special_remarks}
                  onChange={(e) => handleProfileChange('special_remarks', e.target.value)}
                  placeholder="Any additional notes"
                  style={{ minHeight: '60px' }}
                />
              ) : (
                <div className="view-value multiline">
                  {profileForm.special_remarks || 'Not provided'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="form-actions">
          <button className="btn primary" onClick={handleSaveProfile} disabled={profileLoading}>
            {profileLoading ? 'Updating...' : 'Save Changes'}
          </button>
          {profileMessage && <span className="success-text">{profileMessage}</span>}
          {profileError && <span style={{ color: '#b92c2c', fontWeight: '600' }}>{profileError}</span>}
        </div>
  
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
          <p className="section-note">Stay up to date with announcements.</p>
        </div>
        {renderNotifications()}
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
            <span className="section-note">Stay updated with latest announcements.</span>
          </div>
          {renderNotifications()}
        </>
      );
    }

    if (activeNav === "settings") {
      return renderSettings({
        settings,
        setSettings,
        showNewPassword,
        setShowNewPassword,
        showConfirmPassword,
        setShowConfirmPassword,
        errorMessage,
        setErrorMessage,
        savingSettings,
        setSavingSettings,
        saveSuccess,
        setSaveSuccess,
      });
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
            {/* <h1>Welcome back, {profile.name || "Scholar"}</h1>
            <p className="subtle">Your dashboard for managing scholarship documents and alerts.</p> */}
          </div>
        </header>

{error && <div className="error-banner">{error}</div>}
{successMessage && <div className="success-banner">{successMessage}</div>}

        <section className="content-area">{renderMainContent()}</section>
      </main>
    </div>
  );
};
export default StudentDashboard;
