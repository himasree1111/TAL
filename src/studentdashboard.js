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
  { key: "fee-status", label: "Fee Status", icon: "💰" },
  /*{ key: "settings", label: "Student Settings", icon: "⚙️" },*/
];

const DOCUMENT_CATEGORIES = [
  { key: "academic", title: "Academic Documents", icon: "📚", placeholder: "Auto-generated from dropdown" },

  { key: "personal", title: "Personal Documents", icon: "🆔", placeholder: "Select document type" },
  { key: "extracurricular", title: "Extracurricular", icon: "🏆", placeholder: "Enter Activity Name" },
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


const StudentDashboard = () => {
  const getStudentType = useCallback(async (studentId) => {
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
  }, []);
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [profile, setProfile] = useState({});
  const [notifications, setNotifications] = useState([]);
  // notifFilter state removed
  const [documents, setDocuments] = useState(initialDocumentState);

  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState(""); // _error unused
  /*const [settings, setSettings] = useState({
    newPassword: "",
    confirmPassword: ""
  });*/
/*const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);*/
  /*const [errorMessage, setErrorMessage] = useState("");*/
  const [successMessage, setSuccessMessage] = useState("");
  /*const [savingSettings, setSavingSettings] = useState(false);*/
  /*const [saveSuccess, setSaveSuccess] = useState(false);*/
  const [studentId, setStudentId] = useState(null);
  const [studentFormId, setStudentFormId] = useState(null);
  const [formIdLoading, setFormIdLoading] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
const [documentNames, setDocumentNames] = useState(DOCUMENT_CATEGORIES.reduce((acc, cat) => {acc[cat.key] = '';    return acc;  }, {}));

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
    student_public_id: '',
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
  const [feeInfo, setFeeInfo] = useState({});
  const [feeHistory, setFeeHistory] = useState([]); // NEW: Fee history state
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [originalFormData, setOriginalFormData] = useState(null);
const [profileTab, setProfileTab] = useState('personal');
  const [showCustomFamily, setShowCustomFamily] = useState([]);
  const [showCustomEarning, setShowCustomEarning] = useState([]);

  const PROFILE_TABS = [
    { key: 'personal', label: 'Personal Info' },
    { key: 'contact', label: 'Contact' },
    { key: 'academic', label: 'Academic' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'family', label: 'Family' },
    { key: 'other', label: 'Other Details' }
  ];
console.log(studentId, studentType);
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
          student_public_id: formData.student_public_id || '',
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

        const { data: feeData, error: feeError } = await supabase
          .from('fee_tracking')
          .select('*')
          .eq('student_form_id', formData.id)
          .maybeSingle();

        if (!feeError) {
          setFeeInfo(feeData || {});
        }
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

  // Initialize showCustom states when profile loads
  useEffect(() => {
    if (profileForm.family_members_details) {
      const familyCustom = profileForm.family_members_details.map(m => Boolean(m?.custom_relation));
      setShowCustomFamily(familyCustom);
    }
    if (profileForm.earning_members_details) {
      const earningCustom = profileForm.earning_members_details.map(m => Boolean(m?.custom_relation));
      setShowCustomEarning(earningCustom);
    }
  }, [profileForm.family_members_details, profileForm.earning_members_details]);

  useEffect(() => {
    if (!studentFormId) return;

    let isMounted = true;

    const syncFeeInfo = async () => {
      const { data, error } = await supabase
        .from('fee_tracking')
        .select('*')
        .eq('student_form_id', studentFormId)
        .maybeSingle();

      if (!error && isMounted) {
        setFeeInfo(data || {});
      }
    };

    syncFeeInfo();

    const channel = supabase
      .channel(`fee_tracking:${studentFormId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fee_tracking',
          filter: `student_form_id=eq.${studentFormId}`,
        },
        (payload) => {
          if (payload.new) {
            setFeeInfo(payload.new);
          } else {
            syncFeeInfo();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [studentFormId]);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentFormId, fetchDocuments, studentId, studentType]);

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
      let idToUse = null;
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
  idToUse = nonEligibleData.id;   // ✅ FIX
} else {
  setProfile(profileData);
  setStudentId(profileData.id);
  idToUse = profileData.id;       // ✅ FIX
}

      // Fetch student_form_submissions ID for documents (retry logic)
      const fetchFormId = async () => {
        console.log('[DASHBOARD] Fetching studentFormId for email:', studentEmail);
        try {
          // 1. Try student_form_submissions (pending forms)
          let { data: formData } = await supabase
            .from('student_form_submissions')
            .select('id')
            .eq('email', studentEmail)
            .single();

          if (!formData) {
            console.log('[DASHBOARD] No pending form, checking eligible_students');
            // 2. Fallback to eligible_students
            ({ data: formData } = await supabase
              .from('eligible_students')
              .select('student_id')
              .eq('email', studentEmail)
              .single());
            if (formData) formData.id = formData.student_id;
          }

          if (!formData) {
            console.log('[DASHBOARD] No eligible, checking non_eligible_students');
            // 3. Fallback to non_eligible_students
            ({ data: formData } = await supabase
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

      /*setSettings({
        name: profileData?.full_name || '',
        email: profileData?.email || '',
        phone: profileData?.phone || ''
      });*/
      
// const type = await getStudentType(idToUse);
const type = await getStudentType(idToUse);      setStudentType(type);
      
      const res = await getStudentNotifications(type);
      if (res.success) {
        setNotifications(res.notifications);
      }
      
      subscription = subscribeToNotifications((newData) => {
        // if (!studentType) return;
if (filterNotification(newData, type)) {          setNotifications(prev => {
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
}, [studentEmail, getStudentType]);






  /*const handleSaveSettings = async () => {
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
  };*/

  const handleLogout = () => {
    contextLogout();
    navigate('/studentlogin');
  };

const handleUpload = async (category, files, documentName) => {
  console.log('[UPLOAD] Starting upload:', { category, documentName: documentName?.trim(), studentFormId, studentEmail });
  const finalDocumentName = documentName?.trim() || (category === 'fee' ? '' : '');

  if (!finalDocumentName) {
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
      const { error: _uploadError } = await supabase.storage
        .from('student_documents')
        .upload(filePath, file, { 
          cacheControl: '3600',
          upsert: false 
        });

      if (_uploadError) {
        console.error('[UPLOAD]', _uploadError);
        const msg = _uploadError.message.includes('policy') ? 'Upload blocked by permissions. Check Supabase policies.' : _uploadError.message;
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

      // Insert to DB - For fee category, also update fee_tracking table
      if (category === 'fee') {
        // Update ONLY the latest fee_tracking row that has a voucher
        const { data: latestFeeRecord, error: fetchError } = await supabase
          .from('fee_tracking')
          .select('id, fee_receipt_checked')
          .eq('student_form_id', studentFormId)
          .not('voucher_url', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError) {
          console.error('[FEE_RECEIPT] Failed to fetch fee_tracking record:', fetchError);
        } else if (latestFeeRecord) {
          // Only update fee_receipt_url, DO NOT reset fee_receipt_checked
          const { error: feeUpdateError } = await supabase
            .from('fee_tracking')
            .update({
              fee_receipt_url: publicUrl,
              fee_receipt_url_updated_at: new Date().toISOString()
              // Keep existing fee_receipt_checked value - don't reset it!
            })
            .eq('id', latestFeeRecord.id);

          if (feeUpdateError) {
            console.error('[FEE_RECEIPT] Failed to update fee_tracking:', feeUpdateError);
          } else {
            console.log('[FEE_RECEIPT] Successfully updated fee_tracking with receipt');
          }
        }
      }

      const { error: insertError, data: insertData } = await supabase
        .from('student_documents')
        .insert({
          student_id: studentFormId,
          category,
          document_name: finalDocumentName,
          file_name: file.name,
          file_url: publicUrl,
          uploaded_at: new Date().toISOString(),
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

      // When student uploads NEW documents (academic, personal, extracurricular),
      // reset doc_verification_count to 0 so student reappears in Document Verification
      if (category !== 'fee' && category !== 'admin_voucher') {
        console.log('[UPLOAD] Resetting doc_verification_count to 0 for new document upload');
        
        const { error: resetError } = await supabase
          .from('eligible_students')
          .update({ doc_verification_count: 0 })
          .eq('email', studentEmail);
        
        if (resetError) {
          console.error('[UPLOAD] Error resetting doc_verification_count:', resetError);
        } else {
          console.log('[UPLOAD] doc_verification_count reset to 0 successfully');
        }
      }

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

  const calculateTotalExpenses = () => {
    const expenses = profileForm.educational_expenses;
    let total = 0;
    for (const exp of Object.values(expenses)) {
      if (exp.checked && exp.amount) {
        total += parseFloat(exp.amount) || 0;
      }
    }
    return total;
  };

const handleFamilyMemberChange = (index, field, value) => {
    const updatedDetails = [...profileForm.family_members_details];
    if (!updatedDetails[index]) {
      updatedDetails[index] = { name: '', relation: '', custom_relation: '' };
    }
    updatedDetails[index][field] = value;
    
    setProfileForm(prev => ({ ...prev, family_members_details: updatedDetails }));
  };

const handleEarningMemberChange = (index, field, value) => {
    const updatedDetails = [...profileForm.earning_members_details];
    if (!updatedDetails[index]) {
      updatedDetails[index] = { name: '', relation: '', custom_relation: '', occupation: '' };
    }
    updatedDetails[index][field] = value;
    
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
        total_educational_expenses: calculateTotalExpenses(),
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
    <aside className={`student-sidebar ${sidebarOpen ? "open" : ""}`}>
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
            onClick={() => {
              setActiveNav(item.key);
              setSidebarOpen(false);
            }}
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

  const renderStatsBar = () => {
    const latestFee = feeHistory[0] || {};
    const feeStatus = latestFee.fee_status || feeInfo.fee_status || 'Pending';
    const voucherStatus = latestFee.voucher_url ? 'Uploaded' : (feeInfo.voucher_url ? 'Uploaded' : 'Not uploaded');

    return (
      <div className="stats-bar">
        <StatCard icon="🆔" label="Student ID" value={profileForm.student_public_id || 'Pending'} />
        <StatCard icon="💰" label="Fee Status" value={feeStatus} />
        <StatCard icon="📄" label="Voucher" value={voucherStatus} />
        <StatCard icon="🔔" label="Notifications" value={totalNotifications} />
      </div>
    );
  };

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
                    {category.key === 'fee' && feeHistory[0] && (
                      <div style={{ marginTop: '10px', fontSize: '0.92rem', color: '#374151' }}>
                        <div><strong>Required Fee:</strong> ₹{Number(feeHistory[0].total_educational_expenses || 0).toLocaleString()}</div>
                        <div><strong>Fee Status:</strong> {feeHistory[0].fee_status || 'Pending'}</div>
                        <div><strong>Paid by TAL:</strong> ₹{Number(feeHistory[0].fee_paid_by_tal || 0).toLocaleString()}</div>
                        <div>
                          <strong>Voucher:</strong>{' '}
                          {feeHistory[0].voucher_url ? (
                            <a href={feeHistory[0].voucher_url} target="_blank" rel="noreferrer">View uploaded voucher</a>
                          ) : (
                            'Not uploaded yet'
                          )}
                        </div>
                        {feeHistory[0].fee_receipt_url && (
                          <div style={{ marginTop: '8px' }}>
                            <strong>Your Fee Receipt:</strong>{' '}
                            <a href={feeHistory[0].fee_receipt_url} target="_blank" rel="noreferrer">View your uploaded receipt</a>
                            {feeHistory[0].fee_receipt_checked === 'true' && (
                              <span style={{ marginLeft: '8px', color: '#16a34a' }}>✅ Verified</span>
                            )}
                            {feeHistory[0].fee_receipt_checked === 'false' && (
                              <span style={{ marginLeft: '8px', color: '#ca8a04' }}>⏳ Pending Verification</span>
                            )}
                          </div>
                        )}
                        <div style={{ marginTop: '8px', color: '#475569' }}>
                          {feeHistory[0].voucher_url ? (
                            feeHistory[0].fee_receipt_url ? (
                              'Your fee receipt has been uploaded. Waiting for admin verification.'
                            ) : (
                              'Upload your fee receipt (name it with voucher number) here so the admin can verify payment and update your student dashboard status.'
                            )
                          ) : (
                            'Wait for admin to upload the voucher, then upload your fee receipt here.'
                          )}
                        </div>
                      </div>
                    )}

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
<option value="ID Card">ID Card</option>
                    <option value="Passport size photo">Passport size photo</option>
                    <option value="Bonified">Bonified</option>
                    <option value="Income Certificate">Income Certificate</option>
                    <option value="Other Certificate">Other Certificate</option>
                  </select>
                ) : (
                  <input
                    placeholder={category.placeholder}
                    value={documentNames[category.key]}
                    onChange={(e) => setDocumentNames(prev => ({ ...prev, [category.key]: e.target.value }))}
                    className="doc-input"
                  />
                )}

                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const name = documentNames[category.key]?.trim();
                    if (e.target.files?.length) {
                      console.log('[UPLOAD UI] Triggered with name:', name || '(empty)');
                      if (category.key === 'fee' || name) {
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

  /*const renderSettings = ({
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
  };*/

  const getYesNo = (value) => value === 'YES' ? 'Yes' : 'No';

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
                <label>Student ID</label>
                <div className="view-value">
                  {profileForm.student_public_id || 'Not assigned yet'}
                </div>
              </div>
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
                  <textarea
                    value={profileForm.pob}
                    onChange={(e) => handleProfileChange('pob', e.target.value)}
                    rows="3"
                    style={{minHeight: '80px'}}
                  />
                ) : (
                  <div className="view-value multiline">
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
                  <textarea
                    value={profileForm.school}
                    onChange={(e) => handleProfileChange('school', e.target.value)}
                    rows="3"
                    style={{minHeight: '80px'}}
                    required
                  />
                ) : (
                  <div className="view-value multiline">
                    {profileForm.school || 'Not provided'}
                  </div>
                )}
              </div>

<div className="form-row">
                <label>Branch</label>
                {isEditing ? (
                  <textarea
                    value={profileForm.branch}
                    onChange={(e) => handleProfileChange('branch', e.target.value)}
                    rows="3"
                    style={{minHeight: '80px'}}
                  />
                ) : (
                  <div className="view-value multiline">
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
                    rows="5"
                    style={{ minHeight: '120px' }}
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
while (newDetails.length < num) newDetails.push({ name: '', relation: '', custom_relation: '' });
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
while (newDetails.length < num) newDetails.push({ name: '', relation: '', custom_relation: '', occupation: '' });
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
{(() => {
                    const familyMembers = profileForm.family_members_details || [];
                    return familyMembers.map((member, index) => {
                      const safeMember = member || { name: '', relation: '', custom_relation: '' };
                      const displayRelation = safeMember.custom_relation || (safeMember.relation ? safeMember.relation.charAt(0).toUpperCase() + safeMember.relation.slice(1) : 'Not provided');
                      
                      return (
                        <div key={`family-${index}`} className="profile-grid">
                          <div className="form-row">
                            <label>Name</label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={safeMember.name || ''}
                                onChange={(e) => handleFamilyMemberChange(index, 'name', e.target.value)}
                                placeholder="Family member name"
                                required={!isEditing}
                              />
                            ) : (
                              <div className="view-value">
                                {safeMember.name || 'Not provided'}
                              </div>
                            )}
                          </div>
                          <div className="form-row">
                            <label>Relation</label>
                            {isEditing ? (
                              <div className="relation-wrapper">
                                <select
                                  value={safeMember.relation || ''}
                                  onChange={(e) => {
                                    handleFamilyMemberChange(index, 'relation', e.target.value);
                                    const isOthers = e.target.value === 'others';
                                    setShowCustomFamily(prev => {
                                      const newState = [...prev];
                                      newState[index] = isOthers;
                                      return newState;
                                    });
                                  }}
                                  required
                                >
                                  <option value="">Select Relation</option>
                                  <option value="father">Father</option>
                                  <option value="mother">Mother</option>
                                  <option value="sister">Sister</option>
                                  <option value="brother">Brother</option>
                                  <option value="grandfather">Grandfather</option>
                                  <option value="grandmother">Grandmother</option>
                                  <option value="others">Others</option>
                                </select>
                                {showCustomFamily[index] && (
                                  <input
                                    type="text"
                                    value={safeMember.custom_relation || ''}
                                    onChange={(e) => handleFamilyMemberChange(index, 'custom_relation', e.target.value)}
                                    placeholder="Enter custom relation (e.g. uncle, cousin)"
                                    className="custom-relation-input"
                                    required={showCustomFamily[index]}
                                    autoFocus={showCustomFamily[index]}
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="view-value">
                                {displayRelation}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
              </div>
            )}

            {/* Earning Members Details */}
            {profileForm.earning_members_details.length > 0 && (
              <div className="family-section">
                <h4>Earning Members</h4>
{(() => {
                    const earningMembers = profileForm.earning_members_details || [];
                    return earningMembers.map((member, index) => {
                      const safeMember = member || { name: '', relation: '', custom_relation: '', occupation: '' };
                      const displayRelation = safeMember.custom_relation || (safeMember.relation ? safeMember.relation.charAt(0).toUpperCase() + safeMember.relation.slice(1) : 'Not provided');
                      
                      return (
                        <div key={`earning-${index}`} className="profile-grid">
                          <div className="form-row">
                            <label>Name</label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={safeMember.name || ''}
                                onChange={(e) => handleEarningMemberChange(index, 'name', e.target.value)}
                                placeholder="Earning member name"
                                required={!isEditing}
                              />
                            ) : (
                              <div className="view-value">
                                {safeMember.name || 'Not provided'}
                              </div>
                            )}
                          </div>
                          <div className="form-row">
                            <label>Relation</label>
                            {isEditing ? (
                              <div className="relation-wrapper">
                                <select
                                  value={safeMember.relation || ''}
                                  onChange={(e) => {
                                    handleEarningMemberChange(index, 'relation', e.target.value);
                                    const isOthers = e.target.value === 'others';
                                    setShowCustomEarning(prev => {
                                      const newState = [...prev];
                                      newState[index] = isOthers;
                                      return newState;
                                    });
                                  }}
                                  required
                                >
                                  <option value="">Select Relation</option>
                                  <option value="father">Father</option>
                                  <option value="mother">Mother</option>
                                  <option value="sister">Sister</option>
                                  <option value="brother">Brother</option>
                                  <option value="grandfather">Grandfather</option>
                                  <option value="grandmother">Grandmother</option>
                                  <option value="others">Others</option>
                                </select>
                                {showCustomEarning[index] && (
                                  <input
                                    type="text"
                                    value={safeMember.custom_relation || ''}
                                    onChange={(e) => handleEarningMemberChange(index, 'custom_relation', e.target.value)}
                                    placeholder="Enter custom relation (e.g. uncle, cousin)"
                                    className="custom-relation-input"
                                    required={showCustomEarning[index]}
                                    autoFocus={showCustomEarning[index]}
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="view-value">
                                {displayRelation}
                              </div>
                            )}
                          </div>
                          <div className="form-row">
                            <label>Occupation</label>
                            {isEditing ? (
                              <input
                                type="text"
                                value={safeMember.occupation || ''}
                                onChange={(e) => handleEarningMemberChange(index, 'occupation', e.target.value)}
                                placeholder="Occupation"
                                required={!isEditing}
                              />
                            ) : (
                              <div className="view-value">
                                {safeMember.occupation || 'Not provided'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
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
                    {getYesNo(profileForm.is_single_parent)}
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
                    {getYesNo(profileForm.does_work)}
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
                    {getYesNo(profileForm.has_scholarship)}
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

      {(() => {
          const latestFee = feeHistory[0] || {};
          const status = latestFee.fee_status || feeInfo.fee_status || '';
          const paid = latestFee.fee_paid_by_tal || feeInfo.fee_paid_by_tal || 0;
          if (['Paid', 'Partial'].includes(status) && paid > 0) {
            return (
              <div className="success-banner" style={{marginBottom: '20px'}}>
                ✅ <strong>Fee Verified!</strong> Your fee status is now <strong>{status}</strong>. 
                <br/>📝 <strong>Next Step:</strong> Update your <strong>total_educational_expenses</strong> in <em>Profile → Expenses tab</em> 
                so it shows correctly in Admin Fee Tracking after next document verification.
              </div>
            );
          }
          return null;
        })()}
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


  const renderFeeStatus = () => {
    const latest = feeHistory[0];
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: 'INR',
        maximumFractionDigits: 0 
      }).format(amount || 0);
    };

    const getStatusClass = (status) => {
      const classes = {
        'Pending': 'fee-badge-pending',
        'Paid': 'fee-badge-paid',
        'Partial': 'fee-badge-partial',
        'Overdue': 'fee-badge-overdue'
      };
      return classes[status] || 'fee-badge-default';
    };

    return (
      <>
        {/* Hero Header - Removed text */}
        {/*<div className="hero-header" style={{ textAlign: 'center', padding: '1.25rem 1rem', background: 'linear-gradient(135deg, #7fc74a 0%, #6bb43f 100%)', color: 'white', borderRadius: '16px', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>💰</div>
        </div>*/}

        {/* Educational Expenses Update Prompt */}
        {latest && ['Paid', 'Partial'].includes(latest.fee_status) && latest.fee_paid_by_tal > 0 && (
          <div className="success-banner" style={{marginBottom: '20px'}}>
            ✅ <strong>Fee {latest.fee_status === 'Paid' ? 'Paid' : 'Partially Paid'}!</strong> Your fee status is now <strong>{latest.fee_status}</strong>. 
            <br/>📝 <strong>Next Step:</strong> Please <strong>update your educational expenses</strong> in <em>Profile → Expenses tab</em> immediately 
            so your current expenses reflect correctly in Admin Fee Tracking.
          </div>
        )}

        {/* Current Summary */}
        {latest && (
          <div className="section-block">
            <div className="section-header">
              <h3>📊 Current Fee Summary</h3>
              <p className="section-note">Latest record from {new Date(latest.updated_at).toLocaleDateString('en-IN')}</p>
            </div>
            
            {/* Action Alert: Voucher uploaded but student hasn't uploaded receipt */}
            {latest.voucher_url && !latest.fee_receipt_url && (
              <div style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                border: '2px solid #f59e0b',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: '0 4px 6px rgba(245, 158, 11, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ fontSize: '1.5rem' }}>⚠️</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#92400e', fontSize: '1.1rem' }}>
                      Action Required: Upload Your Fee Receipt
                    </h4>
                    <p style={{ margin: '0 0 16px 0', color: '#78350f', fontSize: '0.95rem', lineHeight: '1.5' }}>
                      Admin has uploaded a voucher for your fee payment. <strong>Please upload your fee receipt</strong> so the admin can verify your payment.
                    </p>
                    
                    {/* Inline Upload Form */}
                    <div style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginTop: '12px'
                    }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#92400e', fontSize: '0.9rem' }}>
                        Select Fee Receipt File:
                      </label>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          // Validate file
                          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
                          const maxSize = 10 * 1024 * 1024; // 10MB

                          if (!allowedTypes.includes(file.type)) {
                            setError('Invalid file type. Allowed: PDF, JPG, PNG, GIF, WebP');
                            return;
                          }
                          if (file.size > maxSize) {
                            setError(`File too large (${(file.size/1024/1024).toFixed(1)}MB). Max 10MB`);
                            return;
                          }

                          try {
                            setError('');
                            const safeEmail = studentEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
                            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                            const filePath = `${safeEmail}/fee/${Date.now()}-${safeName}`;

                            // Upload to storage
                            const { error: uploadError } = await supabase.storage
                              .from('student_documents')
                              .upload(filePath, file, { cacheControl: '3600', upsert: false });

                            if (uploadError) throw uploadError;

                            // Get public URL
                            const { data: { publicUrl } } = supabase.storage
                              .from('student_documents')
                              .getPublicUrl(filePath);

                            // Update ONLY the latest fee_tracking row (the one with the voucher)
                            // First, fetch the latest fee_tracking record that has a voucher
                            const { data: latestFeeRecord, error: fetchError } = await supabase
                              .from('fee_tracking')
                              .select('id')
                              .eq('student_form_id', studentFormId)
                              .not('voucher_url', 'is', null)
                              .order('created_at', { ascending: false })
                              .limit(1)
                              .single();

                            if (fetchError) {
                              console.error('[FEE_RECEIPT] Failed to fetch fee_tracking record:', fetchError);
                              throw new Error('No voucher found for fee payment');
                            }

                            // Update ONLY this specific row by ID
                            const { error: updateError } = await supabase
                              .from('fee_tracking')
                              .update({
                                fee_receipt_url: publicUrl,
                                fee_receipt_url_updated_at: new Date().toISOString()
                                // DO NOT reset fee_receipt_checked - keep existing value!
                              })
                              .eq('id', latestFeeRecord.id);

                            if (updateError) throw updateError;

                            // Refresh fee history
                            await fetchFeeHistory();
                            alert('✅ Fee receipt uploaded successfully! Waiting for admin verification.');
                          } catch (err) {
                            console.error('Fee receipt upload error:', err);
                            setError('Upload failed: ' + err.message);
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '2px dashed #f59e0b',
                          borderRadius: '6px',
                          background: '#fffbeb',
                          cursor: 'pointer'
                        }}
                      />
                      <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#92400e' }}>
                        Accepted: PDF, JPG, PNG (Max 10MB)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Success Alert: Fee receipt verified */}
            {latest.fee_receipt_url && latest.fee_receipt_checked === 'true' && (
              <div style={{
                background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                border: '2px solid #10b981',
                borderRadius: '12px',
                padding: '1.25rem',
                marginBottom: '1.5rem',
                boxShadow: '0 4px 6px rgba(16, 185, 129, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ fontSize: '1.5rem' }}>✅</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#065f46', fontSize: '1.1rem' }}>
                      Fee Receipt Verified!
                    </h4>
                    <p style={{ margin: '0', color: '#047857', fontSize: '0.95rem', lineHeight: '1.5' }}>
                      Your fee receipt has been verified by the admin. Your payment status is up to date.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Info Alert: Receipt uploaded, pending verification */}
            {latest.fee_receipt_url && latest.fee_receipt_checked === 'false' && (
              <div style={{
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                border: '2px solid #3b82f6',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                boxShadow: '0 4px 6px rgba(59, 130, 246, 0.1)'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ fontSize: '1.5rem' }}>⏳</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#1e40af', fontSize: '1.1rem' }}>
                      Waiting for Admin Verification
                    </h4>
                    <p style={{ margin: '0 0 16px 0', color: '#1e3a8a', fontSize: '0.95rem', lineHeight: '1.5' }}>
                      Your fee receipt has been uploaded. The admin will verify it soon.
                    </p>
                    
                    {/* Show uploaded receipt and option to re-upload */}
                    <div style={{
                      background: 'white',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginTop: '12px'
                    }}>
                      <div style={{ marginBottom: '12px' }}>
                        <strong style={{ color: '#1e40af', fontSize: '0.9rem' }}>Your Uploaded Receipt:</strong>
                        <div style={{ marginTop: '8px' }}>
                          <a 
                            href={latest.fee_receipt_url} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{
                              display: 'inline-block',
                              padding: '8px 16px',
                              background: '#3b82f6',
                              color: 'white',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              fontWeight: '600',
                              fontSize: '0.9rem'
                            }}
                          >
                            👁️ View Receipt
                          </a>
                        </div>
                      </div>
                      
                      <div style={{ borderTop: '1px solid #dbeafe', paddingTop: '12px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e40af', fontSize: '0.9rem' }}>
                          Need to upload a different receipt?
                        </label>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            // Validate file
                            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
                            const maxSize = 10 * 1024 * 1024; // 10MB

                            if (!allowedTypes.includes(file.type)) {
                              setError('Invalid file type. Allowed: PDF, JPG, PNG, GIF, WebP');
                              return;
                            }
                            if (file.size > maxSize) {
                              setError(`File too large (${(file.size/1024/1024).toFixed(1)}MB). Max 10MB`);
                              return;
                            }

                            try {
                              setError('');
                              const safeEmail = studentEmail.replace(/[^a-zA-Z0-9@._-]/g, '_');
                              const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                              const filePath = `${safeEmail}/fee/${Date.now()}-${safeName}`;

                              // Upload to storage
                              const { error: uploadError } = await supabase.storage
                                .from('student_documents')
                                .upload(filePath, file, { cacheControl: '3600', upsert: false });

                              if (uploadError) throw uploadError;

                              // Get public URL
                              const { data: { publicUrl } } = supabase.storage
                                .from('student_documents')
                                .getPublicUrl(filePath);

                              // Update fee_tracking table
                              const { error: updateError } = await supabase
                                .from('fee_tracking')
                                .update({
                                  fee_receipt_url: publicUrl,
                                  fee_receipt_url_updated_at: new Date().toISOString(),
                                  fee_receipt_checked: 'false'
                                })
                                .eq('student_form_id', studentFormId);

                              if (updateError) throw updateError;

                              // Refresh fee history
                              await fetchFeeHistory();
                              alert('✅ Fee receipt updated successfully! Waiting for admin verification.');
                            } catch (err) {
                              console.error('Fee receipt upload error:', err);
                              setError('Upload failed: ' + err.message);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '2px dashed #3b82f6',
                            borderRadius: '6px',
                            background: '#eff6ff',
                            cursor: 'pointer'
                          }}
                        />
                        <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#1e40af' }}>
                          Accepted: PDF, JPG, PNG (Max 10MB)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="fee-summary-grid">
              <div className="fee-card fee-card-expenses">
                <div className="fee-card-icon">📈</div>
                <div className="fee-card-value">{formatCurrency(latest.total_educational_expenses)}</div>
                <div className="fee-card-label">Total Expenses</div>
              </div>
              <div className="fee-card fee-card-paid">
                <div className="fee-card-icon">✅</div>
                <div className="fee-card-value">{formatCurrency(latest.fee_paid_by_tal)}</div>
                <div className="fee-card-label">Paid by TAL</div>
              </div>
              <div className="fee-card fee-card-balance">
                <div className="fee-card-icon">⚖️</div>
                <div className="fee-card-value">{formatCurrency(latest.balance_due)}</div>
                <div className="fee-card-label">Balance Due</div>
              </div>
              <div className="fee-card fee-card-status">
                <div className="fee-card-icon">🏷️</div>
                <div className={`fee-status-badge ${getStatusClass(latest.fee_status)}`}>
                  {latest.fee_status}
                </div>
                <div className="fee-card-label">Status</div>
              </div>
            </div>
          </div>
        )}

        {/* History Table */}
        <div className="section-block">
          <div className="section-header">
            <h3>📋 Payment History</h3>
            <div className="section-note">{feeHistory.length} record{feeHistory.length !== 1 ? 's' : ''} • <span className="live-indicator">🔴 LIVE</span></div>
          </div>

          {feeHistory.length === 0 ? (
            <div className="empty-hero">
              <div className="empty-icon">📊</div>
              <h4 className="empty-title">No Fee Records Yet</h4>
              <p className="empty-subtitle">Upload documents for admin to create your first fee tracking entry</p>
              <button className="btn primary empty-action" onClick={() => setActiveNav('documents')}>
                📄 Go to Documents
              </button>
            </div>
          ) : (
            <div className="fee-history-container">
              <div className="fee-history-table-wrapper">
                <table className="fee-history-table">
                  <thead>
                    <tr>
                      <th>Date Updated</th>
                      <th>Expenses</th>
                      <th>TAL Paid</th>
                      <th>Balance</th>
                      <th>Status</th>
                      {latest?.voucher_url && <th>Voucher</th>}
                      <th>Fee Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeHistory.map((record) => (
                      <tr key={record.id}>
                        <td className="date-cell">
                          <div className="date">{new Date(record.updated_at).toLocaleDateString('en-IN')}</div>
                          <div className="time">{new Date(record.updated_at).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})}</div>
                        </td>
                        <td className="amount-cell">{formatCurrency(record.total_educational_expenses)}</td>
                        <td className="amount-cell paid">{formatCurrency(record.fee_paid_by_tal)}</td>
                        <td className="amount-cell balance">{formatCurrency(record.balance_due)}</td>
                        <td><span className={`fee-badge ${getStatusClass(record.fee_status)}`}>{record.fee_status}</span></td>
                        {record.voucher_url && (
                          <td className="voucher-cell">
                            <a href={record.voucher_url} target="_blank" rel="noreferrer" className="voucher-link">
                              📎 Voucher
                            </a>
                          </td>
                        )}
                        <td>
                          {record.fee_receipt_url ? (
                            <div>
                              <a href={record.fee_receipt_url} target="_blank" rel="noreferrer" className="voucher-link">
                                📄 Receipt
                              </a>
                              {record.fee_receipt_checked === 'true' && (
                                <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '4px' }}>✅ Verified</div>
                              )}
                              {record.fee_receipt_checked === 'false' && (
                                <div style={{ fontSize: '0.75rem', color: '#ca8a04', marginTop: '4px' }}>⏳ Pending</div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>Not uploaded</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };

  const fetchFeeHistory = useCallback(async () => {
    if (!studentEmail || !studentFormId) return;
    
    try {
      const { data, error } = await supabase
        .from('fee_tracking')
        .select('*')
        .eq('student_form_id', studentFormId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching fee history:', error);
        return;
      }
      
      setFeeHistory(data || []);
    } catch (err) {
      console.error('fetchFeeHistory error:', err);
    }
  }, [studentEmail, studentFormId]);

  useEffect(() => {
    fetchFeeHistory();
  }, [fetchFeeHistory]);

  // Realtime subscription for fee_history
  useEffect(() => {
    if (!studentEmail) return;

    const channel = supabase
      .channel(`fee_history:${studentEmail}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fee_tracking',
          filter: `email=eq.${studentEmail}`,
        },
        (payload) => {
          console.log('FEE HISTORY UPDATE:', payload);
          fetchFeeHistory(); // Refresh full list
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentEmail, fetchFeeHistory]);

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

    if (activeNav === "fee-status") {
      return renderFeeStatus();
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

    /* if (activeNav === "settings") {
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
    }*/

    if (activeNav === "profile") {
      return renderProfile();
    }

    return renderOverview();
  };

  return (
    <div className="student-root">
      {sidebarOpen && (
        <div
          className="student-sidebar-overlay active"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}
      {renderSidebar()}
      <main className="student-main">
        <header className="student-main-header">
          <button
            className="student-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar menu"
          >
            ☰
          </button>
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
