import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import supabase from "./supabaseClient";
import { createNotification, getAdminNotifications, deleteNotification } from "./notificationService";

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

const parseMoney = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const asComparableId = (value) => (value === null || value === undefined ? '' : String(value));

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
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

  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [eligibleStudentsRaw, setEligibleStudentsRaw] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [nonEligibleStudents, setNonEligibleStudents] = useState([]);
  const [loadingNonEligible, setLoadingNonEligible] = useState(false);
  const [nonEligibleCount, setNonEligibleCount] = useState(0);
  const [showEligibleTable, setShowEligibleTable] = useState(false);
  const [showNonEligibleTable, setShowNonEligibleTable] = useState(false);
  const [showAddDonorModal, setShowAddDonorModal] = useState(false);
  const [newDonorForm, setNewDonorForm] = useState({
    full_name: '',
    gender: '',
    phone: '',
    email: '',
    donor_type: 'Individual',
    organization_name: '',
    amount: '',
    payment_method: 'UPI',
    transaction_id: '',
    donation_type: 'One-time',
    donation_date: new Date().toISOString().slice(0, 16), // Today in local time
  });
  const [submittingDonor, setSubmittingDonor] = useState(false);
  const [loadingDonors, setLoadingDonors] = useState(false);

  // Edit donor states
  const [showEditDonorModal, setShowEditDonorModal] = useState(false);
  const [editDonorForm, setEditDonorForm] = useState({});

  // Notification state
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationAudience, setNotificationAudience] = useState("all");
  const [notificationExpiresAt, setNotificationExpiresAt] = useState("");
  const [isAllTimeNotification, setIsAllTimeNotification] = useState(false);
  const [creatingNotification, setCreatingNotification] = useState(false);

  // Admin notifications list
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showNotificationsList, setShowNotificationsList] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Notification list handlers
  const handleToggleNotificationsList = async () => {
    if (!showNotificationsList) {
      setLoadingNotifications(true);
      const result = await getAdminNotifications();
      if (result.success) {
        setAdminNotifications(result.notifications);
      }
      setLoadingNotifications(false);
    }
    setShowNotificationsList(!showNotificationsList);
  };


  const handleDeleteNotification = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    
    setDeletingId(id);
    const result = await deleteNotification(id);
    console.log('[DEBUG] Delete result:', result); // DEBUG
    
    if (result.success) {
      // Refresh full list from server
      const refreshResult = await getAdminNotifications();
      if (refreshResult.success) {
        setAdminNotifications(refreshResult.notifications);
      }
      alert('✅ Deleted successfully');
    } else {
      alert('❌ Delete failed: ' + result.error);
    }
    
    setDeletingId(null);
  };




  const fetchDonors = async () => {
    setLoadingDonors(true);
    try {
      const { data: donorDetails, error: donorError } = await supabase
        .from('donor_details')
        .select('*')
        .order('donation_date', { ascending: false });
      if (donorError) {
        console.error('Error fetching donors:', donorError);
      } else {
        const mappedDonors = (donorDetails || []).map(d => ({
          ...d,
          name: d.full_name,
          formattedAmount: new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: 'INR',
            maximumFractionDigits: 0 
          }).format(d.amount || 0),
          formattedDate: d.donation_date ? formatToIST(d.donation_date) : '—'
        }));
        setDonors(mappedDonors);
      }
    } finally {
      setLoadingDonors(false);
    }
  };

  const attachStudentPublicIds = async (rows = []) => {
    if (!Array.isArray(rows) || rows.length === 0) {
      return [];
    }

    const rowStudentIds = [...new Set(
      rows
        .map((row) => row.student_form_id ?? row.student_id)
        .filter((value) => value !== null && value !== undefined)
    )];

    const rowEmails = [...new Set(
      rows
        .map((row) => (row.email || '').trim())
        .filter(Boolean)
    )];

    const idToPublicId = new Map();
    const emailToPublicId = new Map();

    if (rowStudentIds.length > 0) {
      const { data: byIdRows, error: byIdError } = await supabase
        .from('student_form_submissions')
        .select('id, student_public_id')
        .in('id', rowStudentIds);

      if (byIdError) {
        console.error('Error resolving student_public_id by id:', byIdError);
      } else {
        (byIdRows || []).forEach((item) => {
          if (item?.id && item?.student_public_id) {
            idToPublicId.set(item.id, item.student_public_id);
          }
        });
      }
    }

    if (rowEmails.length > 0) {
      const { data: byEmailRows, error: byEmailError } = await supabase
        .from('student_form_submissions')
        .select('email, student_public_id, created_at')
        .in('email', rowEmails)
        .order('created_at', { ascending: false });

      if (byEmailError) {
        console.error('Error resolving student_public_id by email:', byEmailError);
      } else {
        (byEmailRows || []).forEach((item) => {
          const emailKey = (item?.email || '').trim();
          if (emailKey && item?.student_public_id && !emailToPublicId.has(emailKey)) {
            emailToPublicId.set(emailKey, item.student_public_id);
          }
        });
      }
    }

    return rows.map((row) => {
      const emailKey = (row.email || '').trim();
      const lookupStudentId = row.student_form_id ?? row.student_id;
      return {
        ...row,
        student_public_id:
          row.student_public_id ||
          idToPublicId.get(lookupStudentId) ||
          emailToPublicId.get(emailKey) ||
          null,
      };
    });
  };

  // Fetch user and real data from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setCurrentUser(session.user);

          // Initialize settings with current user data
          setAdminName(session.user.user_metadata?.name || session.user.email?.split('@')[0] || "");
        } else {
          // If no session, redirect to login
          navigate('/');
        }

        // Fetch ALL students from student_form_submissions (no status filter)
        const { data: studentData, error: studentError } = await supabase
          .from('admin_student_info')
          .select('*')
          .eq('status', 'Pending')
          .order('created_at', { ascending: false });

        // Save raw fetch result for debugging
        setLastFetch({ data: studentData || null, error: studentError, fetchedAt: new Date().toISOString() });

        if (studentError) {
          console.error('AdminDashboard: Error fetching student data:', studentError);
        } else {
          console.log('AdminDashboard: fetched studentData (count):', Array.isArray(studentData) ? studentData.length : 0);
          // Transform student data to match admin dashboard format
          const transformedStudents = (studentData || []).map((student, index) => {
            const transformed = {
              id: student.id || index + 1,
              student_id: student.id,
              student_form_id: student.student_id || null,
              student_public_id: student.student_public_id || null,
              name: student.full_name || "",
              full_name: student.full_name || "",
              year: student.class || student.year,
              fee_status: student.fee || "Not Provided",
              course: student.educationcategory || student.class || student.year || student.course || "—",
              campName: student.camp_name,
              campDate: student.camp_date
                ? new Date(student.camp_date).toISOString().split("T")[0]
                : "",
              age: student.age,
              class: student.class,
              prev_percent: student.prev_percent,
              present_percent: student.present_percent,
              email: student.email,
              contact: student.contact,
              whatsapp: student.whatsapp,
              student_contact: student.student_contact,
              school: student.school,
              college: student.college,
              academic_achievements_choice: student.academic_achievements_choice || student.academic_achievements || '',
              non_academic_achievements_choice: student.non_academic_achievements_choice || student.non_academic_achievements || '',
              academic_achievements: student.academic_achievements || '',
              non_academic_achievements: student.non_academic_achievements || '',
              scholarship: student.scholarship,
              has_scholarship: student.has_scholarship,
              does_work: student.does_work,
              earning_members: student.earning_members,
              created_at: student.created_at
            };
            return transformed;
          });
          const studentsWithPublicIds = await attachStudentPublicIds(transformedStudents);
          setStudents(studentsWithPublicIds);
        }

        // Fetch donors
        await fetchDonors();
        await fetchEligibleStudents();

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchEligibleCount();
    fetchNonEligibleCount();
    fetchFeeTrackingRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);



  // New filters for replacement
  const [newFilters, setNewFilters] = useState({ camp: 'all', education: 'all', toppers: false, achievements: 'all' });

  // Unique values for dropdowns
  const uniqueCamps = useMemo(() => {
    const camps = students.map(s => s.campName || 'Unknown').filter(Boolean);
    return ['all', ...new Set(camps)];
  }, [students]);

  const uniqueEducations = useMemo(() => {
    const educations = [...students.map(s => s.course).filter(Boolean), ...students.map(s => s.year).filter(Boolean)];
    return ['all', ...new Set(educations)];
  }, [students]);

  const achievementsFilterOptions = [
    { value: 'all', label: 'All Certificates' },
    { value: 'both', label: 'Academic + Non-Academic' },
    { value: 'academic_only', label: 'Academic Only' },
    { value: 'non_academic_only', label: 'Non-Academic Only' },
  ];

  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);
  const [editStudent, setEditStudent] = useState(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [viewEligibleStudent, setViewEligibleStudent] = useState(null);
  const [viewNonEligibleStudent, setViewNonEligibleStudent] = useState(null);
  const [viewDocumentsStudent, setViewDocumentsStudent] = useState(null);
  const [studentDocuments, setStudentDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [feeSectionTab, setFeeSectionTab] = useState('tracking');
  const [feeTrackingRecords, setFeeTrackingRecords] = useState([]);
  const [loadingFeeTracking, setLoadingFeeTracking] = useState(false);
  const [savingFeeRecord, setSavingFeeRecord] = useState(false);
  const [uploadingVoucherFor, setUploadingVoucherFor] = useState(null);
  const [feePaidInput, setFeePaidInput] = useState({});
  const [viewingFeeStudent, setViewingFeeStudent] = useState(null);

  const totals = useMemo(() => {
    const totalStudents = students.length;
    const feesCollected = donors.reduce((s, d) => s + d.amount, 0);
    const pendingFees = students.filter((s) => s.feeStatus === "Pending").length;
    const activeDonors = donors.length;
    return { totalStudents, feesCollected, pendingFees, activeDonors };
  }, [students, donors]);

  const verifiedFeeStudents = useMemo(() => {
    return eligibleStudentsRaw.filter((student) => (student.verified_count || 0) > 0);
  }, [eligibleStudentsRaw]);

  const getFeeTrackingRecord = (student) => {
    const studentFormId = student.student_form_id || student.student_id || student.id;
    if (!studentFormId) return null;
    const comparableStudentId = asComparableId(studentFormId);
    return feeTrackingRecords.find((record) => asComparableId(record.student_form_id) === comparableStudentId);
  };

  const feeTrackingStudents = useMemo(() => {
    return verifiedFeeStudents.filter((student) => {
      const record = getFeeTrackingRecord(student);
      return parseMoney(record?.fee_paid_by_tal) <= 0;
    });
  }, [verifiedFeeStudents, feeTrackingRecords]);

  const paidFeeRecords = useMemo(() => {
    return feeTrackingRecords.filter((record) => parseMoney(record.fee_paid_by_tal) > 0);
  }, [feeTrackingRecords]);

  const feeReceiptRecords = useMemo(() => {
    return paidFeeRecords.filter((record) => Boolean(record.voucher_url));
  }, [paidFeeRecords]);

  const totalFeeDue = useMemo(() => {
    return feeTrackingRecords.reduce((sum, record) => {
      const requiredFee = parseMoney(record.required_fee);
      const paidAmount = parseMoney(record.fee_paid_by_tal);
      return sum + Math.max(requiredFee - paidAmount, 0);
    }, 0);
  }, [feeTrackingRecords]);

const getMaxPercent = React.useCallback((s) => {
  return Math.max(
    parseFloat(s.prev_percent || 0),
    parseFloat(s.present_percent || 0)
  );
}, []);  const getAvgPercentage = (s) => {
    const prev = parseFloat(s.prev_percent || 0);
    const pres = parseFloat(s.present_percent || 0);
    const avg = ((prev + pres) / 2).toFixed(1);
    return avg > 0 ? avg + '%' : '—';
  };

 const calculatePriority = React.useCallback((s) => {
  const incomeScore = Math.max(0, 40 - (parseInt(s.earning_members || 1) * 10));
  const academicScore = Math.min(25, getMaxPercent(s));

  let familyScore = 0;
  if (s.has_scholarship === false && s.does_work === false && parseInt(s.earning_members || 0) <= 2) {
    familyScore = 20;
  } else if (!s.has_scholarship || !s.does_work) {
    familyScore = 10;
  }

  const extraScore =
    (parseFloat(s.prev_percent || 0) < parseFloat(s.present_percent || 0) ? 10 : 0) +
    (s.does_work === false ? 5 : 0);

  return Math.min(100, Math.max(0, incomeScore + academicScore + familyScore + extraScore));
}, [getMaxPercent]);

  // Updated filteredStudents with new filters (old filters deprecated)
  const filteredStudents = useMemo(() => {
    const normalizeAchievementFlag = (value) => {
      if (value === true || value === 'true' || value === 'YES' || value === 'yes' || value === 'Y' || value === 'y') {
        return true;
      }
      if (typeof value === 'string' && value.trim().length > 0) {
        return true;
      }
      return false;
    };

    const filterAchievementMatch = (student) => {
      const hasAcademic = normalizeAchievementFlag(student.academic_achievements_choice) || normalizeAchievementFlag(student.academic_achievements);
      const hasNonAcademic = normalizeAchievementFlag(student.non_academic_achievements_choice) || normalizeAchievementFlag(student.non_academic_achievements);

      if (newFilters.achievements === 'both') return hasAcademic && hasNonAcademic;
      if (newFilters.achievements === 'academic_only') return hasAcademic && !hasNonAcademic;
      if (newFilters.achievements === 'non_academic_only') return !hasAcademic && hasNonAcademic;
      return true;
    };

    return students
      .filter((s) => {
        // New filters
        if (newFilters.camp !== 'all' && s.campName !== newFilters.camp) return false;
        if (newFilters.education !== 'all' && s.course !== newFilters.education && s.year !== newFilters.education) return false;
        if (newFilters.toppers && getMaxPercent(s) < 90) return false;
        if (!filterAchievementMatch(s)) return false;
        return true;
      })
      .map(s => ({...s, priority: calculatePriority(s)}))
      .sort((a, b) => b.priority - a.priority);
}, [students, newFilters, calculatePriority, getMaxPercent]);
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
        // Fetch document counts for each student using email as link
        const studentsWithDocs = await Promise.all((data || []).map(async (student) => {
          // First get the student_form_submissions ID using email
          const { data: formData } = await supabase
            .from('student_form_submissions')
            .select('id')
            .eq('email', student.email)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const studentFormId = formData?.id;
          const { data: docs } = studentFormId ? await supabase
            .from('student_documents')
            .select('category, is_checked')
            .eq('student_id', studentFormId)
            : { data: [] };

          const academics = docs?.filter(d => d.category === 'academic')?.length || 0;
          const personal = docs?.filter(d => d.category === 'personal')?.length || 0;
          const extracurricular = docs?.filter(d => d.category === 'extracurricular')?.length || 0;
          const verifiedCount = docs?.filter(d => d.is_checked).length || 0;
          const totalDocs = docs?.length || 0;

          return {
            ...student,
            academic_count: academics,
            personal_count: personal,
            extracurricular_count: extracurricular,
            verified_count: verifiedCount,
            document_count: totalDocs
          };
        }));

        const studentsWithPublicIds = await attachStudentPublicIds(studentsWithDocs);

        const pendingVerificationStudents = (studentsWithPublicIds || []).filter((student) => {
          const isFullyVerified = student.document_count > 0 && student.verified_count === student.document_count;
          return !isFullyVerified;
        });

        setEligibleStudentsRaw(studentsWithPublicIds || []);
        setEligibleStudents(pendingVerificationStudents);
        setEligibleCount(pendingVerificationStudents?.length || 0);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error fetching data');
    } finally {
      setLoadingEligible(false);
    }
  };

  const handleViewDocuments = async (student, category) => {
    setViewDocumentsStudent(student);
    setLoadingDocs(true);

    try {
      // Get student_form_submissions ID using email
      const { data: formData } = await supabase
        .from('student_form_submissions')
        .select('id')
        .eq('email', student.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const studentFormId = formData?.id;
      if (!studentFormId) {
        alert('Student form not found');
        setLoadingDocs(false);
        return;
      }

      // Fetch documents for this category
      const { data: docs, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', studentFormId)
        .eq('category', category)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setStudentDocuments(docs || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      alert('Error fetching documents: ' + err.message);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleVerifyStudentDocuments = async (student) => {
    setLoadingEligible(true);
    try {
      const { data: formData, error: formError } = await supabase
        .from('student_form_submissions')
        .select('id')
        .eq('email', student.email)
        .single();

      if (formError || !formData?.id) {
        alert('Unable to verify documents: student form not found');
        return;
      }

      const { error: updateError } = await supabase
        .from('student_documents')
        .update({ is_checked: true })
        .eq('student_id', formData.id)
        .in('category', ['academic', 'personal', 'extracurricular']);

      if (updateError) {
        console.error('Error verifying documents:', updateError);
        alert('Unable to mark documents as verified: ' + updateError.message);
        return;
      }

      await fetchEligibleStudents();
      alert('Documents marked verified successfully.');
    } catch (err) {
      console.error('Error verifying documents:', err);
      alert('Error verifying documents: ' + err.message);
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
        const studentsWithPublicIds = await attachStudentPublicIds(data || []);
        setNonEligibleStudents(studentsWithPublicIds);
        setNonEligibleCount(studentsWithPublicIds?.length || 0);
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error fetching data');
    } finally {
      setLoadingNonEligible(false);
    }
  };

  const fetchFeeTrackingRecords = async () => {
    setLoadingFeeTracking(true);
    try {
      const { data, error } = await supabase
        .from('fee_tracking')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching fee tracking records:', error);
        return;
      }
      setFeeTrackingRecords(data || []);
    } catch (err) {
      console.error('Error fetching fee tracking records:', err);
    } finally {
      setLoadingFeeTracking(false);
    }
  };

  const handleFeePaidChange = (studentId, value) => {
    setFeePaidInput((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleSaveFeeRecord = async (student) => {
    const studentFormId = student.student_form_id || student.student_id || student.id;
    if (!studentFormId) {
      alert('Cannot save fee record: missing student form id');
      return;
    }

    const normalizedStudentFormId = Number(studentFormId);
    const recordStudentFormId = Number.isFinite(normalizedStudentFormId) ? normalizedStudentFormId : studentFormId;
    const existingRecord = getFeeTrackingRecord(student);
    const requiredFee = parseMoney(existingRecord?.required_fee ?? student.fee ?? student.required_fee);
    const paidValue = parseMoney(feePaidInput[studentFormId] ?? existingRecord?.fee_paid_by_tal ?? 0);
    const feeStatus = paidValue === 0 ? 'Pending' : paidValue >= requiredFee && requiredFee > 0 ? 'Paid' : 'Partial';
    const studentName = student.student_name || student.full_name || student.name || existingRecord?.student_name;
    const studentEmail = student.email || existingRecord?.email;
    const studentPublicId = student.student_public_id || existingRecord?.student_public_id || asComparableId(studentFormId);

    if (!studentName || !studentEmail) {
      alert('Cannot save fee record: student name and email are required');
      return;
    }

    const payload = {
      student_form_id: recordStudentFormId,
      student_public_id: studentPublicId,
      student_name: studentName,
      email: studentEmail,
      whatsapp_number: student.whatsapp_number || student.whatsapp || existingRecord?.whatsapp_number || null,
      camp_name: student.camp_name || student.campName || existingRecord?.camp_name || null,
      camp_date: student.camp_date || student.campDate || existingRecord?.camp_date || null,
      education: student.education || student.course || student.educationcategory || existingRecord?.education || null,
      school: student.school || existingRecord?.school || null,
      branch: student.branch || existingRecord?.branch || null,
      required_fee: requiredFee,
      fee_paid_by_tal: paidValue,
      fee_status: feeStatus,
      updated_at: new Date().toISOString(),
    };

    setSavingFeeRecord(true);
    try {
      const { data: existing, error: findError } = await supabase
        .from('fee_tracking')
        .select('id')
        .eq('student_form_id', recordStudentFormId)
        .maybeSingle();

      if (findError) {
        console.error('Error locating fee tracking record:', findError);
        alert('Unable to save fee record.');
        return;
      }

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from('fee_tracking')
          .update(payload)
          .eq('id', existing.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('fee_tracking')
          .insert(payload);

        if (insertError) {
          throw insertError;
        }
      }

      await fetchFeeTrackingRecords();
      alert('Fee record saved successfully.');
    } catch (err) {
      console.error('Error saving fee record:', err);
      alert('Unable to save fee record: ' + err.message);
    } finally {
      setSavingFeeRecord(false);
    }
  };

  const handleUploadVoucher = async (student, file) => {
    const studentFormId = student.student_form_id || student.student_id || student.id;
    if (!studentFormId) {
      alert('Cannot upload voucher: missing student form id');
      return;
    }

    const safeEmail = (student.email || 'student').replace(/[^a-zA-Z0-9@._-]/g, '_');
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${safeEmail}/voucher/${Date.now()}-${safeName}`;

    setUploadingVoucherFor(studentFormId);
    try {
      const { error: uploadError } = await supabase.storage
        .from('student_documents')
        .upload(filePath, file, { upsert: false });
      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('student_documents')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('student_documents')
        .insert({
          student_id: studentFormId,
          category: 'fee',
          document_name: 'Voucher Upload',
          file_name: file.name,
          file_url: publicUrl,
          uploaded_at: new Date().toISOString(),
        });

      if (insertError) {
        throw insertError;
      }

      const { data: existing, error: findError } = await supabase
        .from('fee_tracking')
        .select('id, student_name, email, student_public_id, fee_paid_by_tal')
        .eq('student_form_id', studentFormId)
        .maybeSingle();

      if (findError) {
        throw findError;
      }

      if (!existing?.id || parseMoney(existing.fee_paid_by_tal) <= 0) {
        alert('Save the fee record first before uploading a voucher.');
        return;
      }

      const updatePayload = {
        voucher_url: publicUrl,
        voucher_uploaded_at: new Date().toISOString(),
      };

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from('fee_tracking')
          .update(updatePayload)
          .eq('id', existing.id);
        if (updateError) throw updateError;
      }

      await fetchFeeTrackingRecords();
      alert('Voucher uploaded successfully.');
    } catch (err) {
      console.error('Error uploading voucher:', err);
      alert('Voucher upload failed: ' + err.message);
    } finally {
      setUploadingVoucherFor(null);
    }
  };

  const handleDownloadEligibleReport = () => {
    if (eligibleStudents.length === 0) {
      alert('No eligible students to export');
      return;
    }

    const rows = [
      "student_public_id,student_name,email,contact,education,year,school,college,created_at",
      ...eligibleStudents.map(s => 
        `"${s.student_public_id || ''}","${s.student_name || ''}","${s.email || ''}","${s.contact || ''}","${s.education || ''}","${s.year || ''}","${s.school || ''}","${s.college || ''}","${s.created_at || ''}"`
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
      "student_public_id,student_name,email,contact,education,year,school,college,created_at",
      ...nonEligibleStudents.map(s => 
        `"${s.student_public_id || ''}","${s.student_name || ''}","${s.email || ''}","${s.contact || ''}","${s.education || ''}","${s.year || ''}","${s.school || ''}","${s.college || ''}","${s.created_at || ''}"`
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
/*
  const handleDelete = (id) => {
    if (!window.confirm("Delete this student record?")) return;
    setStudents((prev) => prev.filter((p) => p.id !== id));
  };
*/


const handleApprove = async (student) => {
  try {
    // 1️⃣ Get full record from admin_student_info
    const { data: record, error: fetchError } = await supabase
      .from('admin_student_info')
      .select('*')
      .eq('id', student.student_id)
      .single();

    if (fetchError || !record) {
      console.error(fetchError);
      alert("❌ Record not found in admin_student_info");
      return;
    }

    // 2️⃣ Move to eligible_students
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

    // 3️⃣ SEND EMAIL (IMPORTANT 🔥)
    try {
     const { data: { session } } = await supabase.auth.getSession();



      const response = await fetch("https://rmsmoqkfunrumebfjzah.supabase.co/functions/v1/send-eligibility-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}` // ✅ IMPORTANT
        },
        body: JSON.stringify({
          email: record.email,
          name: record.full_name || "Student",
        }),
      });


      const result = await response.json();
      console.log("📩 Email response:", result);
    } catch (emailErr) {
      console.error("❌ Email sending failed:", emailErr);
      // Don't stop main flow
    }

    // 4️⃣ Delete from pending table
    const { error: deleteError } = await supabase
      .from('admin_student_info')
      .delete()
      .eq('id', student.student_id);

    if (deleteError) {
      console.error(deleteError);
      alert("❌ Failed to remove from pending: " + deleteError.message);
      return;
    }

    // 5️⃣ Update UI
    setStudents(prev => prev.filter(s => s.student_id !== student.student_id));

    alert("✅ Student approved & email sent!");

  } catch (err) {
    console.error(err);
    alert("❌ Error: " + err.message);
  }
};


const handleNotApprove = async (student) => {
  try {
    // Get full record first from admin_student_info table
    const { data: record } = await supabase
      .from('admin_student_info')
      .select('*')
      .eq('id', student.student_id)
      .single();

    if (!record) {
      alert("❌ Record not found in admin_student_info");
      return;
    }

    // Insert to non_eligible_students with ALL fields mapped
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

    // Delete from admin_student_info
    const { error: deleteError } = await supabase
      .from('admin_student_info')
      .delete()
      .eq('id', student.student_id);

    if (deleteError) {
      console.error(deleteError);
      alert("❌ Failed to remove from pending: " + deleteError.message);
      return;
    }

    // Refresh list
    fetchStudents();

    alert("✅ Student moved to Non-Eligible successfully!");

  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
};
const fetchStudents = async () => {
  const { data, error } = await supabase
    .from('admin_student_info')
    .select('*')
    .eq('status', 'Pending');

  if (error) {
    console.error(error);
    return;
  }

  // Transform data to match table format
  const transformedStudents = (data || []).map((student, index) => ({
    id: student.id || index + 1,
    student_id: student.id,
    student_form_id: student.student_id || null,
    student_public_id: student.student_public_id || null,
    name: student.student_name || student.full_name || '',
    year: student.year || student.class || '',
    email: student.email,
    contact: student.contact,
    class: student.class || student.year || '',
    full_name: student.student_name || student.full_name || '',
    created_at: student.created_at
  }));

  const studentsWithPublicIds = await attachStudentPublicIds(transformedStudents);
  setStudents(studentsWithPublicIds);
};





  const handleEditSave = (data) => {
    // Data contains id + updated fields
    setStudents((prev) => prev.map((p) => (p.id === data.id ? { ...p, ...data } : p)));
    setEditStudent(null);
  };

  const exportCSV = () => {
    // include new fields campName,campDate,course,paidDate
    const rows = [
      "student_public_id,name,college,year,donor,feeStatus,course,campName,campDate,paidDate",
      ...students.map(s => `"${s.student_public_id || ""}","${s.name}","${s.college}",${s.year},${s.donor},${s.feeStatus},${s.course || ""},"${s.campName || ""}",${s.campDate || ""},${s.paidDate || ""}`)
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
  /*const handleAddDonor = () => {
    const name = window.prompt('Donor name');
    if (!name) return;
    const amount = window.prompt('Amount (number)');
    if (!amount) return;
    const newDonor = { id: Date.now(), name, amount: Number(amount), years: '2025-2026' };
    setDonors((d) => [...d, newDonor]);
    alert('Donor added (demo)');
  };
  */
/*
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
*/

  // Edit donor state
  const [editingDonor, setEditingDonor] = useState(null);
  
const handleEditDonor = (donor) => {
    const editData = {...donor, donation_date: donor.donation_date ? donor.donation_date.slice(0,16) : ''};
    setEditingDonor(editData);
    setEditDonorForm(editData);
    setShowEditDonorModal(true);
  };
  
  const handleDeleteDonor = async (donor) => {
    if (!window.confirm(`Delete donor ${donor.full_name}?`)) return;
    
    const { error } = await supabase
      .from('donor_details')
      .delete()
      .eq('id', donor.id);
    
    if (error) {
      alert('❌ Delete failed: ' + error.message);
    } else {
      await fetchDonors();
      alert('✅ Donor deleted');
    }
  };


  const handleExportDonorReport = () => {
    const rows = ['id,full_name,email,phone,donor_type,amount,payment_method,transaction_id,donation_type,donation_date,created_at', 
                  ...donors.map(d => `${d.id},"${d.full_name || d.name}","${d.email}","${d.phone || ''}","${d.donor_type}","${d.amount}","${d.payment_method || ''}","${d.transaction_id || ''}","${d.donation_type}","${d.donation_date}","${d.created_at}"`)];
    const blob = new Blob([rows.join('\\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'donors.csv';
    a.click();
    URL.revokeObjectURL(url);
    alert('Donor report downloaded successfully!');
  };

  const handleOpenAddDonor = () => {
    setNewDonorForm({
      full_name: '',
      gender: '',
      phone: '',
      email: '',
      donor_type: 'Individual',
      organization_name: '',
      amount: '',
      payment_method: 'UPI',
      transaction_id: '',
      donation_type: 'One-time',
      donation_date: new Date().toISOString().slice(0, 16),
    });
    setShowAddDonorModal(true);
  };

  const handleCancelAddDonor = () => {
    setShowAddDonorModal(false);
  };

  const validateDonorForm = (form) => {
    if (!form.full_name.trim()) return 'Full name is required';
    if (form.phone && !/^\d{10}$/.test(form.phone.replace(/[^0-9]/g, ''))) return 'Phone must be valid 10-digit number';
    if (!form.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Invalid email format';
    if (form.gender && !['Male', 'Female', 'Other'].includes(form.gender)) return 'Select Male, Female, or Other';
    if (!form.donor_type) return 'Donor type is required';
    if (form.donor_type === 'Organization' && !form.organization_name.trim()) return 'Organization name is required';
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) return 'Valid positive amount is required';
    if (!form.payment_method) return 'Payment method is required';
    if (!form.transaction_id.trim()) return 'Transaction ID is required';
    if (!form.donation_type) return 'Donation type is required';
    if (!form.donation_date) return 'Donation date is required';
    return null;
  };


  const handleSubmitNewDonor = async (e) => {
    e.preventDefault();
    const error = validateDonorForm(newDonorForm);
    if (error) {
      alert('❌ ' + error);
      return;
    }

    setSubmittingDonor(true);
    try {
      const formData = {
        full_name: newDonorForm.full_name.trim(),
        gender: newDonorForm.gender.trim() || null,
        phone: newDonorForm.phone.trim() || null,
        email: newDonorForm.email.trim().toLowerCase(),  // normalize email
        donor_type: newDonorForm.donor_type,
        organization_name: newDonorForm.organization_name.trim() || null,
        amount: parseFloat(newDonorForm.amount),
        payment_method: newDonorForm.payment_method,
        transaction_id: newDonorForm.transaction_id.trim() || `TXN_${Date.now()}`,
        donation_type: newDonorForm.donation_type,
        donation_date: newDonorForm.donation_date ? new Date(newDonorForm.donation_date).toISOString() : new Date().toISOString(),
        created_at: new Date().toISOString()
      };


      const {  error } = await supabase
        .from('donor_details')
        .insert([formData])
        .select()
        .single();

      if (error) {
        console.error('Error adding donor:', error);
        alert('❌ Failed to add donor: ' + (error.message || error));
        return;
      }

      // Refresh donors list
      await fetchDonors();

      alert('✅ Donor added successfully!');
      setShowAddDonorModal(false);
    } catch (err) {
      console.error('Unexpected error:', err);
      alert('❌ An unexpected error occurred');
    } finally {
      setSubmittingDonor(false);
    }
  };

  const handleEditDonorFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'full_name') {
      const cleanedValue = value.replace(/[^a-zA-Z\s.'-]/g, '');
      setEditDonorForm(prev => ({ ...prev, [name]: cleanedValue }));
      return;
    }
    setEditDonorForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEditPhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setEditDonorForm(prev => ({ ...prev, phone: value }));
  };

  const handleDonorFormChange = (e) => {
    const { name, value } = e.target;
    // Allow only letters, spaces, and common name characters for full_name
    if (name === 'full_name') {
      const cleanedValue = value.replace(/[^a-zA-Z\s.'-]/g, '');
      setNewDonorForm(prev => ({ ...prev, [name]: cleanedValue }));
      return;
    }
    setNewDonorForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    setNewDonorForm(prev => ({ ...prev, phone: value }));
  };

  const handleCancelEditDonor = () => {
    setShowEditDonorModal(false);
    setEditingDonor(null);
    setEditDonorForm({});
  };

  const handleSubmitEditDonor = async (e) => {
    e.preventDefault();
    const error = validateDonorForm(editDonorForm);
    if (error) {
      alert('❌ ' + error);
      return;
    }
    setSubmittingDonor(true);
    try {
      const formData = {
        full_name: editDonorForm.full_name.trim(),
        gender: editDonorForm.gender.trim() || null,
        phone: editDonorForm.phone.trim() || null,
        email: editDonorForm.email.trim().toLowerCase(),
        donor_type: editDonorForm.donor_type,
        organization_name: editDonorForm.organization_name.trim() || null,
        amount: parseFloat(editDonorForm.amount),
        payment_method: editDonorForm.payment_method,
        transaction_id: editDonorForm.transaction_id.trim(),
        donation_type: editDonorForm.donation_type,
        donation_date: editDonorForm.donation_date ? new Date(editDonorForm.donation_date).toISOString() : new Date().toISOString()
      };
      const {  error } = await supabase
        .from('donor_details')
        .update(formData)
        .eq('id', editingDonor.id)
        .select()
        .single();
      if (error) {
        console.error('Update error:', error);
        alert('❌ Update failed: ' + error.message);
        return;
      }
      await fetchDonors();
      alert('✅ Donor updated successfully!');
      setShowEditDonorModal(false);
      setEditingDonor(null);
      setEditDonorForm({});
    } catch (err) {
      console.error(err);
      alert('❌ Unexpected error');
    } finally {
      setSubmittingDonor(false);
    }
  };
  const handleSendReminders = () => {
    alert('Reminders sent (demo)');
  };

  const handleDownloadFeeReport = () => {
    const sourceRows = feeSectionTab === 'tracking'
      ? feeTrackingStudents.map((student) => {
          const record = getFeeTrackingRecord(student);
          const requiredFee = parseMoney(record?.required_fee ?? student.fee);
          const paidAmount = parseMoney(record?.fee_paid_by_tal);
          const balance = Math.max(requiredFee - paidAmount, 0);
          return {
            student_public_id: student.student_public_id || record?.student_public_id || '',
            student_name: student.student_name || student.full_name || student.name || record?.student_name || '',
            email: student.email || record?.email || '',
            required_fee: requiredFee,
            paid_amount: paidAmount,
            balance,
            fee_status: record?.fee_status || 'Pending',
          };
        })
      : feeSectionTab === 'receipts'
        ? feeReceiptRecords.map((record) => {
            const requiredFee = parseMoney(record.required_fee);
            const paidAmount = parseMoney(record.fee_paid_by_tal);
            const balance = Math.max(requiredFee - paidAmount, 0);
            return {
              student_public_id: record.student_public_id || '',
              student_name: record.student_name || '',
              email: record.email || '',
              required_fee: requiredFee,
              paid_amount: paidAmount,
              balance,
              fee_status: record.fee_status || 'Pending',
            };
          })
        : paidFeeRecords.map((record) => {
            const requiredFee = parseMoney(record.required_fee);
            const paidAmount = parseMoney(record.fee_paid_by_tal);
            const balance = Math.max(requiredFee - paidAmount, 0);
            return {
              student_public_id: record.student_public_id || '',
              student_name: record.student_name || '',
              email: record.email || '',
              required_fee: requiredFee,
              paid_amount: paidAmount,
              balance,
              fee_status: record.fee_status || 'Pending',
            };
          });

    if (sourceRows.length === 0) {
      alert('No fee records available to export');
      return;
    }

    const rows = [
      'student_public_id,student_name,email,required_fee,paid_amount,balance,status',
      ...sourceRows.map((row) => `"${row.student_public_id}","${row.student_name}","${row.email}",${row.required_fee},${row.paid_amount},${row.balance},"${row.fee_status}"`),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fee-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateReport = () => {
    alert('Custom report generated (demo)');
  };

  const handleDownloadFeeReceiptsReport = () => {
    if (feeReceiptRecords.length === 0) {
      alert('No completed fee receipts found');
      return;
    }

    const rows = [
      'student_public_id,student_name,email,required_fee,paid_amount,balance,status,voucher_uploaded_at',
      ...feeReceiptRecords.map((record) => {
        const requiredFee = parseMoney(record.required_fee);
        const paidAmount = parseMoney(record.fee_paid_by_tal);
        const balance = Math.max(requiredFee - paidAmount, 0);
        return `"${record.student_public_id || ''}","${record.student_name || ''}","${record.email || ''}",${requiredFee},${paidAmount},${balance},"${record.fee_status || 'Pending'}","${record.voucher_uploaded_at || ''}"`;
      }),
    ];

    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fee-receipts-report.csv';
    a.click();
    URL.revokeObjectURL(url);
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

  const handleSaveSettings = async () => {
    try {
      // Update user metadata with the new admin name
      if (currentUser) {
        const { error } = await supabase.auth.updateUser({
          data: {
            name: adminName,
            contact_number: contactNumber,
            preferences: {
              email_notifications: emailNotifications,
              sms_alerts: smsAlerts,
              system_notifications: systemNotifications,
              default_language: "English",
              time_zone: "IST (UTC+5:30)",
            }
          }
        });

        if (error) {
          console.error('Error updating user settings:', error);
          alert('Error saving settings: ' + error.message);
          return;
        }

        // Update the current user state with the new name
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
/*
  // When opening edit modal, create a shallow copy so editing doesn't mutate state directly
  const openEditModal = (s) => {
    setEditStudent({ ...s });
  };
*/
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Handle creating notifications
  const handleCreateNotification = async (e) => {
    e.preventDefault();
    setCreatingNotification(true);

  const formattedDate = notificationExpiresAt
  ? new Date(notificationExpiresAt).toISOString()
  : null;

    const result = await createNotification(
  notificationTitle,
  notificationMessage,
  notificationAudience,
  formattedDate
);

    if (!isAllTimeNotification && !notificationExpiresAt) {
      alert("Please select an expiry time or check 'All time notification'.");
      setCreatingNotification(false);
      return;
    }

    if (result.success) {
      alert("Notification created successfully!");
      // Reset form including new state
      setNotificationTitle("");
      setNotificationMessage("");
      setNotificationAudience("all");
      setNotificationExpiresAt("");
      setIsAllTimeNotification(false);
    } else {
      alert("Error creating notification: " + result.error);
    }

    setCreatingNotification(false);
  };

  // Filter Components
  const FilterCard = ({ title, icon, options, value, onChange }) => (
    <div className="filter-card" style={{ position: 'relative' }}>
      <div className="filter-icon">{icon}</div>
      <div className="filter-title">{title}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="filter-select"
      >
        {options.map((opt, idx) => {
          const optionValue = opt.value ?? opt;
          const optionLabel = opt.label ?? (optionValue === 'all' ? 'All' : optionValue.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()));
          return (
            <option key={idx} value={optionValue}>
              {optionLabel}
            </option>
          );
        })}
      </select>
    </div>
  );

  const FilterToggle = ({ title, icon, checked, onChange }) => (
    <div className={`filter-card filter-toggle ${checked ? 'filter-active' : ''}`} onClick={() => onChange(!checked)}>
      <div className="filter-icon">{icon}</div>
      <div className="filter-title">{title}</div>
      <div className={`toggle-switch ${checked ? 'active' : ''}`}></div>
    </div>
  );

  return (

    <div className="admin-root">
     <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand">Touch A Life - Admin</div>
          <nav>
            <ul>
              <li className={activeSection === "overview" ? "active" : ""} onClick={() => setActiveSection("overview")}>Dashboard Overview</li>
              <li className={activeSection === "manage" ? "active" : ""} onClick={() => setActiveSection("manage")}>Manage Beneficiaries</li>
<li className={activeSection === "mapping" ? "active" : ""} onClick={() => setActiveSection("mapping")}>Donor Details</li>
              <li className={activeSection === "verification" ? "active" : ""} onClick={() => setActiveSection("verification")}>Document Verification</li>
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
  <div
    className="sidebar-overlay"
    onClick={() => setSidebarOpen(false)}
  />
)}

      <div className="admin-main">
        <header className="admin-header">
  <div className="header-left">
    <button 
      className="menu-toggle"
      onClick={() => setSidebarOpen(!sidebarOpen)}
    >
      ☰
    </button>

    <h2>
      {activeSection === "overview" 
        ? "Dashboard Overview" 
        : activeSection === "manage" 
        ? "Manage Beneficiaries" 
        : activeSection === "mapping" 
        ? "Donor Details" 
        : activeSection === "verification" 
        ? "Document Verification" 
        : activeSection === "fees" 
        ? "Fee Tracking" 
        : activeSection === "broadcast" 
        ? "Alerts & Broadcast" 
        : activeSection === "reports" 
        ? "Reports & Exports" 
        : "Settings"}
    </h2>
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
              {/* Overview cards */}
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
                    <div className="card-title">Donation  Collected</div>
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
              
              {/*
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
              */}
            </>
          )} 

          {/* Manage Beneficiaries */}
          {activeSection === "manage" && (
            <section className="manage-section">
              <div className="manage-controls">
<div className="new-filters-grid">
                  <FilterCard 
                    title="Camp" 
                    icon="🏕️" 
                    options={uniqueCamps} 
                    value={newFilters.camp} 
                    onChange={(val) => setNewFilters(f => ({...f, camp: val}))} 
                  />
                  <FilterCard 
                    title="Education" 
                    icon="🎓" 
                    options={uniqueEducations} 
                    value={newFilters.education} 
                    onChange={(val) => setNewFilters(f => ({...f, education: val}))} 
                  />
                  <FilterToggle 
                    title="Toppers" 
                    icon="⭐" 
                    checked={newFilters.toppers} 
                    onChange={(val) => setNewFilters(f => ({...f, toppers: val}))} 
                  />
                  <FilterCard 
                    title="Achievements" 
                    icon="🏆" 
                    options={achievementsFilterOptions} 
                    value={newFilters.achievements} 
                    onChange={(val) => setNewFilters(f => ({...f, achievements: val}))} 
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
                      <th>CampName</th>
                      <th>Priority</th>
                      <th>Percentage</th> {/* Academic performance */}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
{filteredStudents.map(s => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{s.course || '—'}</td>
                        <td className="nowrap-cell">{s.contact || '—'}</td>
                        <td>{s.campName || '—'}</td>
                        <td className={`priority-cell priority-${s.priority >= 80 ? 'high' : s.priority >= 50 ? 'medium' : 'low'}`}>
                          <div><strong>{Math.round(s.priority)}</strong>/100</div>
                          <div className="priority-label">
                            {s.priority >= 80 ? 'High Need' : s.priority >= 50 ? 'Medium Need' : 'Low Need'}
                          </div>
                        </td>
                        <td>{getAvgPercentage(s)}</td>
                        <td>
                          <div className="actions-flex" style={{justifyContent: 'center', gap: '6px'}}>
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
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Debug panel: show raw fetch when no students present to help diagnose Supabase issues */}
              {students.length === 0 && lastFetch && (
                <div className="debug-panel">
                  <h4>No more forms to Review</h4>
                  
                  
                </div>
              )}
            </section>
          )}

{activeSection === "mapping" && (
            <section className="donor-details-section">
              <div className="section-header">
                <h3>Donor Details</h3>
                <div className="section-actions">
                  <button className="btn primary" onClick={handleOpenAddDonor}>Add Donor</button>
                  <button className="btn primary" onClick={handleExportDonorReport}>Export Report</button>
                </div>
              </div>

              <div className="mapping-stats">
                <div className="stat-box">
                  <div className="value">₹{donors.reduce((s,d) => s + (d.amount || 0), 0)}</div>
                  <div className="label">Total Funds Available</div>
                </div>
                <div className="stat-box">
                  <div className="value">{donors.length}</div>
                  <div className="label">Active Donors</div>
                </div>
                <div className="stat-box">
                  <div className="value">85%</div>
                  <div className="label">Fund Utilization</div>
                </div>
              </div>

              {loadingDonors ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  Loading donors...
                </div>
              ) : donors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>
                  <h4>No donors found</h4>
                  <p>Add your first donor using the button above.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Donor Type</th>
                        <th>Amount</th>
                        <th>Payment Method</th>
                        <th>Donation Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donors.map(d => (
                        <tr key={d.id}>
                          <td>{d.full_name || d.name || '—'}</td>
                          <td>{d.email || '—'}</td>
                          <td>{d.phone || '—'}</td>
                          <td>{d.donor_type || '—'}</td>
                          <td>{d.formattedAmount}</td>
                          <td>{d.payment_method || '—'}</td>
                          <td>{d.formattedDate}</td>
                          <td>
                            <div style={{display: 'flex', gap: '6px'}}>
                              <button className="btn small outline" onClick={() => setViewDonor(d)} style={{minWidth: '36px'}}>View</button>
                              <button className="btn small primary" onClick={() => handleEditDonor(d)}>Edit</button>
                              <button className="btn small danger" onClick={() => handleDeleteDonor(d)}>Delete</button>
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

{showAddDonorModal && (
                <div className="modal-overlay" onClick={handleCancelAddDonor}>
<div className="modal donor-modal-wide" onClick={(e) => e.stopPropagation()}>
                    <h3>Add New Donor</h3>
                    <form className="donor-form-grid" onSubmit={handleSubmitNewDonor}>
                      <label>
                        Full Name *
                        <input 
                          name="full_name" 
                          value={newDonorForm.full_name} 
                          onChange={handleDonorFormChange}
                          required 
                        />
                      </label>

                      <label>
                        Gender
                        <select name="gender" value={newDonorForm.gender} onChange={handleDonorFormChange}>
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </label>
                      <label>
                        Phone
                        <input 
                          type="tel" 
                          name="phone" 
                          value={newDonorForm.phone} 
                          onChange={handlePhoneChange} 
                          maxLength={10}
                          placeholder="Enter 10-digit phone number"
                        />
                      </label>
                      <label>
                        Email *
                        <input 
                          type="email" 
                          name="email" 
                          value={newDonorForm.email} 
                          onChange={handleDonorFormChange}
                          required 
                        />
                      </label>

                      <label>
                        Donor Type *
                        <select name="donor_type" value={newDonorForm.donor_type} onChange={handleDonorFormChange} required>
                          <option value="Individual">Individual</option>
                          <option value="Organization">Organization</option>
                        </select>
                      </label>
                      {newDonorForm.donor_type === 'Organization' && (
                        <label>
                          Organization Name
                          <input 
                            name="organization_name" 
                            value={newDonorForm.organization_name} 
                            onChange={handleDonorFormChange} 
                          />
                        </label>
                      )}
                      <label>
                        Donation Amount *
                        <input 
                          type="number" 
                          name="amount" 
                          value={newDonorForm.amount} 
                          onChange={handleDonorFormChange}
                          min="1" 
                          required 
                        />

                      </label>
                      <label>
                        Payment Method *

                        <select name="payment_method" value={newDonorForm.payment_method} onChange={handleDonorFormChange} required>
                          <option value="UPI">UPI</option>
                          <option value="Net Banking">Net Banking</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                        </select>

                      </label>
                      <label>
                        Transaction ID
                        <input name="transaction_id" value={newDonorForm.transaction_id} onChange={handleDonorFormChange} />
                      </label>
                      <label>
                        Donation Type *
                        <select name="donation_type" value={newDonorForm.donation_type} onChange={handleDonorFormChange} required>
                          <option value="One-time">One-time</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                      </label>
                      <label>
                        Donation Date *
                        <input 
                          type="datetime-local" 
                          name="donation_date" 
                          value={newDonorForm.donation_date} 
                          onChange={handleDonorFormChange}
                          required 
                        />
                      </label>
<div style={{display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb'}}>
                        <button type="submit" className="btn primary" disabled={submittingDonor} style={{flex: 1}}>
                          {submittingDonor ? 'Adding...' : 'Add Donor'}
                        </button>
                        <button type="button" className="btn secondary" onClick={handleCancelAddDonor} disabled={submittingDonor}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              {showEditDonorModal && editingDonor && (
                <div className="modal-overlay" onClick={handleCancelEditDonor}>
                  <div className="modal donor-modal-wide" onClick={(e) => e.stopPropagation()}>
                    <h3>Edit Donor - {editingDonor.full_name}</h3>
                    <form className="donor-form-grid" onSubmit={handleSubmitEditDonor}>
                      <label>
                        Full Name *
                        <input 
                          name="full_name" 
                          value={editDonorForm.full_name || ''} 
                          onChange={handleEditDonorFormChange}
                          required 
                        />
                      </label>

                      <label>
                        Gender
                        <select name="gender" value={editDonorForm.gender || ''} onChange={handleEditDonorFormChange}>
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </label>
                      <label>
                        Phone
                        <input 
                          type="tel" 
                          name="phone" 
                          value={editDonorForm.phone || ''} 
                          onChange={handleEditPhoneChange} 
                          maxLength={10}
                          placeholder="Enter 10-digit phone number"
                        />
                      </label>
                      <label>
                        Email *
                        <input 
                          type="email" 
                          name="email" 
                          value={editDonorForm.email || ''} 
                          onChange={handleEditDonorFormChange}
                          required 
                        />
                      </label>

                      <label>
                        Donor Type *
                        <select name="donor_type" value={editDonorForm.donor_type || 'Individual'} onChange={handleEditDonorFormChange} required>
                          <option value="Individual">Individual</option>
                          <option value="Organization">Organization</option>
                        </select>
                      </label>
                      {editDonorForm.donor_type === 'Organization' && (
                        <label>
                          Organization Name
                          <input 
                            name="organization_name" 
                            value={editDonorForm.organization_name || ''} 
                            onChange={handleEditDonorFormChange} 
                          />
                        </label>
                      )}
                      <label>
                        Donation Amount *
                        <input 
                          type="number" 
                          name="amount" 
                          value={editDonorForm.amount || ''} 
                          onChange={handleEditDonorFormChange}
                          min="1" 
                          required 
                        />
                      </label>
                      <label>
                        Payment Method *
                        <select name="payment_method" value={editDonorForm.payment_method || ''} onChange={handleEditDonorFormChange} required>
                          <option value="UPI">UPI</option>
                          <option value="Net Banking">Net Banking</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                        </select>
                      </label>
                      <label>
                        Transaction ID *
                        <input 
                          name="transaction_id" 
                          value={editDonorForm.transaction_id || ''} 
                          onChange={handleEditDonorFormChange}
                          required 
                        />
                      </label>
                      <label>
                        Donation Type *
                        <select name="donation_type" value={editDonorForm.donation_type || ''} onChange={handleEditDonorFormChange} required>
                          <option value="One-time">One-time</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Yearly">Yearly</option>
                        </select>
                      </label>
                      <label>
                        Donation Date *
                        <input 
                          type="datetime-local" 
                          name="donation_date" 
                          value={editDonorForm.donation_date || ''} 
                          onChange={handleEditDonorFormChange}
                          required 
                        />
                      </label>
                      <div style={{display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb'}}>
                        <button type="submit" className="btn primary" disabled={submittingDonor} style={{flex: 1}}>
                          {submittingDonor ? 'Updating...' : 'Update Donor'}
                        </button>
                        <button type="button" className="btn secondary" onClick={handleCancelEditDonor} disabled={submittingDonor}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeSection === "verification" && (
            <section className="verification-section">
              <div className="section-header">
                <h3>Document Verification</h3>
                <div className="section-actions">
                  <button className="btn primary" onClick={() => {
                    setLoadingEligible(true);
                    fetchEligibleStudents().then(() => setLoadingEligible(false));
                  }}>Refresh Documents</button>
                </div>
              </div>

              {loadingEligible ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  Loading documents...
                </div>
              ) : eligibleStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>
                  <h4>No Eligible Students</h4>
                  <p>Documents will appear here once students are marked as eligible.</p>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Email</th>
                        <th>Class</th>
                        <th>Education Documents</th>
                        <th>Personal Documents</th>
                        <th>Achievements Documents</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eligibleStudents.map((student) => (
                        <tr key={student.id}>
                          <td>{student.student_name || student.full_name || '—'}</td>
                          <td>{student.email || '—'}</td>
                          <td>{student.class || student.year || student.course || '—'}</td>
                          <td>
                            <span 
                              className="doc-badge" 
                              style={{backgroundColor: '#e3f2fd', color: '#1976d2', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: student.academic_count > 0 ? 'pointer' : 'default', opacity: student.academic_count > 0 ? 1 : 0.6}}
                              onClick={() => student.academic_count > 0 && handleViewDocuments(student, 'academic')}
                            >
                              {student.academic_count || 0} files
                            </span>
                          </td>
                          <td>
                            <span 
                              className="doc-badge" 
                              style={{backgroundColor: '#f3e5f5', color: '#7b1fa2', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: student.personal_count > 0 ? 'pointer' : 'default', opacity: student.personal_count > 0 ? 1 : 0.6}}
                              onClick={() => student.personal_count > 0 && handleViewDocuments(student, 'personal')}
                            >
                              {student.personal_count || 0} files
                            </span>
                          </td>
                          <td>
                            <span 
                              className="doc-badge" 
                              style={{backgroundColor: '#fff3e0', color: '#e65100', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: student.extracurricular_count > 0 ? 'pointer' : 'default', opacity: student.extracurricular_count > 0 ? 1 : 0.6}}
                              onClick={() => student.extracurricular_count > 0 && handleViewDocuments(student, 'extracurricular')}
                            >
                              {student.extracurricular_count || 0} files
                            </span>
                          </td>
                          <td className="actions-flex">
                            <button
                              className="btn small icon-only view-btn"
                              aria-label="View documents"
                              onClick={() => setViewEligibleStudent(student)}
                            >
                              👁
                            </button>
                            <button
                              className={`btn small icon-only verify-btn ${student.document_count > 0 && student.verified_count === student.document_count ? 'verified' : ''}`}
                              aria-label={student.document_count > 0 && student.verified_count === student.document_count ? 'Verified' : 'Mark Verified'}
                              disabled={student.document_count === 0 || student.verified_count === student.document_count}
                              onClick={() => handleVerifyStudentDocuments(student)}
                            >
                              ✅
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeSection === "fees" && (
            <section className="fees-section">
              <div className="section-header">
                <h3>Fee Tracking</h3>
                <div className="section-actions">
                  <button className="btn primary" onClick={handleSendReminders}>Send Reminders</button>
                  <button className="btn" onClick={handleDownloadFeeReport}>Download Report</button>
                </div>
              </div>

              <div className="fee-tabs" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <button
                  className={`btn ${feeSectionTab === 'tracking' ? 'primary' : ''}`}
                  onClick={() => setFeeSectionTab('tracking')}
                >
                  Fee Tracking
                </button>
                <button
                  className={`btn ${feeSectionTab === 'voucher' ? 'primary' : ''}`}
                  onClick={() => setFeeSectionTab('voucher')}
                >
                  Voucher Uploading
                </button>
                <button
                  className={`btn ${feeSectionTab === 'receipts' ? 'primary' : ''}`}
                  onClick={() => setFeeSectionTab('receipts')}
                >
                  Fee Receipts
                </button>
              </div>

              <div className="fee-summary">
                <div className="fee-card">
                  <div className="amount">{verifiedFeeStudents.length}</div>
                  <div className="label">Verified Students</div>
                </div>
                <div className="fee-card">
                  <div className="amount">₹{totalFeeDue.toLocaleString()}</div>
                  <div className="label">Total Fee Due</div>
                </div>
                <div className="fee-card">
                  <div className="amount">{paidFeeRecords.length}</div>
                  <div className="label">Students with Fee Records</div>
                </div>
              </div>

              {loadingFeeTracking && (
                <div style={{ textAlign: 'center', padding: '1rem', color: '#555' }}>
                  Loading fee records...
                </div>
              )}

              {feeSectionTab === 'tracking' ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Required Fee</th>
                        <th>Paid Amount</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeTrackingStudents.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>
                            No students are pending fee tracking.
                          </td>
                        </tr>
                      ) : feeTrackingStudents.map((student) => {
                        const studentFormId = student.student_form_id || student.student_id || student.id;
                        const record = getFeeTrackingRecord(student);
                        const currentPaid = feePaidInput[studentFormId] ?? (record?.fee_paid_by_tal ?? '');
                        const requiredFee = parseMoney(record?.required_fee ?? student.fee);
                        const paidAmount = parseMoney(record?.fee_paid_by_tal);
                        const balance = Math.max(requiredFee - paidAmount, 0);
                        const status = record?.fee_status || 'Pending';
                        return (
                          <tr key={studentFormId || student.id}>
                            <td>{student.student_name || student.full_name || student.name || '—'}</td>
                            <td>{requiredFee > 0 ? `₹${requiredFee.toLocaleString()}` : '—'}</td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                placeholder="Enter paid amount"
                                value={currentPaid}
                                onChange={(e) => handleFeePaidChange(studentFormId, e.target.value)}
                                style={{ width: '100px', padding: '6px', borderRadius: '6px', border: '1px solid #ccc' }}
                              />
                            </td>
                            <td>₹{balance.toLocaleString()}</td>
                            <td>
                              <span className={`status-badge ${status.toLowerCase()}`}>
                                {status}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  className="btn small"
                                  onClick={() => setViewingFeeStudent(student)}
                                >
                                  View
                                </button>
                                <button
                                  className="btn small primary"
                                  onClick={() => handleSaveFeeRecord(student)}
                                  disabled={savingFeeRecord}
                                >
                                  {savingFeeRecord ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : feeSectionTab === 'voucher' ? (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Email</th>
                        <th>Required Fee</th>
                        <th>Paid Amount</th>
                        <th>Status</th>
                        <th>Voucher</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paidFeeRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '1rem' }}>
                            No fee records are ready for voucher upload yet.
                          </td>
                        </tr>
                      ) : paidFeeRecords.map((record) => {
                        const requiredFee = parseMoney(record.required_fee);
                        const paidAmount = parseMoney(record.fee_paid_by_tal);
                        const balance = Math.max(requiredFee - paidAmount, 0);
                        return (
                          <tr key={record.id || record.student_form_id}>
                            <td>{record.student_name || '—'}</td>
                            <td>{record.email || '—'}</td>
                            <td>₹{requiredFee.toLocaleString()}</td>
                            <td>₹{paidAmount.toLocaleString()}</td>
                            <td>
                              <span className={`status-badge ${record.fee_status?.toLowerCase() || 'pending'}`}>
                                {record.fee_status || 'Pending'}
                              </span>
                            </td>
                            <td>
                              {record.voucher_url ? (
                                <a href={record.voucher_url} target="_blank" rel="noreferrer">View Voucher</a>
                              ) : (
                                <label className="btn small" style={{ cursor: 'pointer' }}>
                                  {uploadingVoucherFor === record.student_form_id ? 'Uploading...' : 'Upload'}
                                  <input
                                    type="file"
                                    accept="application/pdf,image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleUploadVoucher(record, file);
                                      }
                                      e.target.value = null;
                                    }}
                                  />
                                </label>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Email</th>
                        <th>Required Fee</th>
                        <th>Paid Amount</th>
                        <th>Voucher</th>
                        <th>Uploaded At</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeReceiptRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '1rem' }}>
                            No completed fee receipts found yet.
                          </td>
                        </tr>
                      ) : feeReceiptRecords.map((record) => {
                        const requiredFee = parseMoney(record.required_fee);
                        const paidAmount = parseMoney(record.fee_paid_by_tal);
                        return (
                          <tr key={record.id || record.student_form_id}>
                            <td>{record.student_name || '—'}</td>
                            <td>{record.email || '—'}</td>
                            <td>₹{requiredFee.toLocaleString()}</td>
                            <td>₹{paidAmount.toLocaleString()}</td>
                            <td>
                              {record.voucher_url ? (
                                <a href={record.voucher_url} target="_blank" rel="noreferrer">View Voucher</a>
                              ) : (
                                'Not uploaded'
                              )}
                            </td>
                            <td>{record.voucher_uploaded_at ? formatToIST(record.voucher_uploaded_at) : '—'}</td>
                            <td>
                              <span className={`status-badge ${record.fee_status?.toLowerCase() || 'pending'}`}>
                                {record.fee_status || 'Pending'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Fee Student Details Modal */}
          {viewingFeeStudent && (
            <div className="modal-overlay" onClick={() => setViewingFeeStudent(null)}>
              <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Student Fee Details</h3>
                  <button className="close-btn" onClick={() => setViewingFeeStudent(null)}>×</button>
                </div>
                <div className="modal-body">
                  {(() => {
                    const student = viewingFeeStudent;
                    const record = getFeeTrackingRecord(student);
                    const paidAmount = parseMoney(record?.fee_paid_by_tal);
                    const requiredFee = parseMoney(record?.required_fee ?? student.fee);
                    const balance = requiredFee - paidAmount;
                    const status = record?.fee_status || 'Pending';

                    return (
                      <div className="student-details-grid">
                        <div className="detail-section">
                          <h4>Personal Information</h4>
                          <div className="detail-row">
                            <span className="label">Student ID:</span>
                            <span className="value">{student.student_public_id || '—'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Full Name:</span>
                            <span className="value">{student.student_name || student.full_name || student.name || record?.student_name || '—'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Email:</span>
                            <span className="value">{student.email || '—'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Contact:</span>
                            <span className="value">{student.contact || student.student_contact || '—'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">WhatsApp:</span>
                            <span className="value">{student.whatsapp || '—'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Age:</span>
                            <span className="value">{student.age || '—'}</span>
                          </div>
                        </div>

                        <div className="detail-section">
                          <h4>Educational Information</h4>
                          <div className="detail-row">
                            <span className="label">Education:</span>
                            <span className="value">{student.educationcategory || student.course || student.class || '—'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Branch:</span>
                            <span className="value">{student.branch || '—'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Year:</span>
                            <span className="value">{student.year || student.class || '—'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">School:</span>
                            <span className="value">{student.school || '—'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">College:</span>
                            <span className="value">{student.college || '—'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Previous Year %:</span>
                            <span className="value">{student.prev_percent ? `${student.prev_percent}%` : '—'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Current Year %:</span>
                            <span className="value">{student.present_percent ? `${student.present_percent}%` : '—'}</span>
                          </div>
                        </div>

                        <div className="detail-section">
                          <h4>Financial Information</h4>
                          <div className="detail-row">
                            <span className="label">Required Fee:</span>
                            <span className="value">{requiredFee > 0 ? `₹${requiredFee.toLocaleString()}` : '—'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Paid by TAL:</span>
                            <span className="value">₹{paidAmount.toLocaleString()}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Balance:</span>
                            <span className="value">₹{Math.max(balance, 0).toLocaleString()}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Fee Status:</span>
                            <span className={`value status-badge ${status.toLowerCase()}`}>{status}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Voucher:</span>
                            <span className="value">
                              {record?.voucher_url ? (
                                <a href={record.voucher_url} target="_blank" rel="noreferrer">View Voucher</a>
                              ) : (
                                'Not uploaded'
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="detail-section">
                          <h4>Family & Scholarship Information</h4>
                          <div className="detail-row">
                            <span className="label">Scholarship:</span>
                            <span className="value">{student.scholarship || '—'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Has Scholarship:</span>
                            <span className="value">{student.has_scholarship ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Does Work:</span>
                            <span className="value">{student.does_work ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Earning Members:</span>
                            <span className="value">{student.earning_members || '—'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Academic Achievements:</span>
                            <span className="value">{student.academic_achievements_choice || student.academic_achievements || '—'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Non-Academic Achievements:</span>
                            <span className="value">{student.non_academic_achievements_choice || student.non_academic_achievements || '—'}</span>
                          </div>
                        </div>

                        <div className="detail-section">
                          <h4>Camp Information</h4>
                          <div className="detail-row">
                            <span className="label">Camp Name:</span>
                            <span className="value">{student.camp_name || '—'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Camp Date:</span>
                            <span className="value">{student.camp_date ? new Date(student.camp_date).toLocaleDateString() : '—'}</span>
                          </div>
                        </div>

                        <div className="detail-section">
                          <h4>Timestamps</h4>
                          <div className="detail-row">
                            <span className="label">Created:</span>
                            <span className="value">{student.created_at ? formatToIST(student.created_at) : '—'}</span>
                          </div>
                          <div className="detail-row">
                            <span className="label">Fee Record Updated:</span>
                            <span className="value">{record?.updated_at ? formatToIST(record.updated_at) : '—'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="modal-footer">
                  <button className="btn" onClick={() => setViewingFeeStudent(null)}>Close</button>
                </div>
              </div>
            </div>
          )}

          {/* Broadcast */} 
          {activeSection === "broadcast" && (
            <section className="broadcast-section">
              <div className="section-header">
                <h3>Create Notification</h3>
                <div className="section-actions">
                  <button className="btn primary" onClick={handleToggleNotificationsList}>
                    {showNotificationsList ? 'Hide List' : 'View All Notifications'}
                  </button>
                </div>
              </div>

              {showNotificationsList && (
                <div className="notifications-list" style={{marginBottom: '2rem', background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 12px rgba(20,24,40,0.06)'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                    <h4 style={{margin: 0}}>All Notifications ({adminNotifications.length})</h4>
                    <button className="btn" onClick={() => setShowNotificationsList(false)}>Close</button>
                  </div>
                  {loadingNotifications ? (
                    <p>Loading notifications...</p>
                  ) : adminNotifications.length === 0 ? (
                    <p>No notifications created yet.</p>
                  ) : (
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Audience</th>
                            <th>Expires</th>
                            <th>Created</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminNotifications.map((notif) => (
                            <tr key={notif.id}>
                              <td style={{fontWeight: 500}}>{notif.title}</td>
                              <td>{notif.audience}</td>
                              <td>{notif.expires_at ? formatToIST(notif.expires_at) : 'Never'}</td>
                              <td>{formatToIST(notif.created_at)}</td>
                              <td>
                                <button 
                                  className="btn small danger" 
                                  onClick={() => handleDeleteNotification(notif.id)}
                                  disabled={deletingId === notif.id}
                                >
                                  {deletingId === notif.id ? 'Deleting...' : 'Delete'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

<form onSubmit={handleCreateNotification} className="notification-form" noValidate>
                <div className="form-group">

                  <label>
                    <span className="field-label">Notification Title <span style={{color: 'red'}}>*</span></span>
                    <input
                      type="text"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      required
                      placeholder="Enter notification title"
                    />
                  </label>
                  <label>
                    <span className="field-label">Target Audience</span>
                    <select
                      value={notificationAudience}
                      onChange={(e) => setNotificationAudience(e.target.value)}
                    >
                      <option value="all">All Students</option>
                      <option value="eligible">Eligible Students Only</option>
                      <option value="non-eligible">Non-Eligible Students Only</option>
                    </select>
                  </label>
                </div>

                <div className="form-group">
                  <label className="full-width">
                    <span className="field-label">Message <span style={{color: 'red'}}>*</span></span>
                    <textarea
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      required
                      rows={4}
                      placeholder="Enter notification message"
                    />
                  </label>
                </div>


<div className="notification-form-group">
                  <div className="checkbox-container">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={isAllTimeNotification}
                        onChange={(e) => {
                          setIsAllTimeNotification(e.target.checked);
                          if (e.target.checked) setNotificationExpiresAt("");
                        }}
                      /> All time notification (no expiry)
                    </label>
                  </div>
                  <div className="expiry-container">
                    <label>
                      <span className="field-label">Expires At <span style={{color: 'red'}}>*</span> (Mandatory unless checked above)</span>
                      <input
                        type="datetime-local"
                        value={notificationExpiresAt}
                        onChange={(e) => setNotificationExpiresAt(e.target.value)}
                        required={!isAllTimeNotification}
                        disabled={isAllTimeNotification}
                      />
                    </label>
                  </div>
                </div>


                <button
                  type="submit"
                  className="btn form-submit-btn primary"
                  disabled={creatingNotification}
                >
                  {creatingNotification ? "Creating..." : "Create Notification"}
                </button>
              </form>
            </section>
          )}

          {/* Reports */}
          {activeSection === "reports" && (
            <section className="reports-section">
              <div className="section-header">
                <h3>Reports & Analytics </h3>
                <div className="section-actions">
                  <button className="btn" onClick={handleGenerateReport}>Generate Custom Report</button>
                </div>
              </div>

              <div className="reports-grid">
                <div className="report-card">
                  <h4>Financial Overview</h4>
                  <div className="report-meta">
                    <p>Total Funds: <strong>₹{donors.reduce((s,d) => s + (d.amount || 0), 0)}</strong></p>
                  </div>
                  <div className="chart-container">
                    <div className="chart-placeholder">Chart Coming Soon</div>
                  </div>
                  <div className="report-actions">
                    <button className="btn small" onClick={() => handleDownloadSpecificReport('financial')}>Download Report</button>
                  </div>
                </div>

                <div className="report-card">
                  <h4>Fee Receipts</h4>
                  <div className="report-meta">
                    <p>Completed Receipts: <strong>{feeReceiptRecords.length}</strong></p>
                  </div>
                  <div className="chart-container">
                    <div className="chart-placeholder">Fee receipts completed and ready for export.</div>
                  </div>
                  <div className="report-actions">
                    <button className="btn small view-btn" onClick={() => setActiveSection('fees')}>View Page</button>
                    <button className="btn small" onClick={handleDownloadFeeReceiptsReport} disabled={feeReceiptRecords.length === 0}>
                      Download Report
                    </button>
                  </div>
                </div>

                <div className="report-card">
                  <h4>Donor Contributions</h4>
                  <div className="report-meta">
                    <p>Total Donors: <strong>{donors.length}</strong></p>
                  </div>
                  <div className="chart-container">
                    <div className="chart-placeholder">Chart Coming Soon</div>
                  </div>
                  <div className="report-actions">
                    <button className="btn small" onClick={() => handleDownloadSpecificReport('donor')}>Download Report</button>
                  </div>
                </div>
                {/* Eligible Students Report */}
                <div className="report-card">
                  <h4>Eligible Students</h4>
                  <div className="report-meta">
                    <p>Total Eligible: <strong>{eligibleCount}</strong></p>
                  </div>
                  <div className="chart-container">
                    <div className="chart-placeholder">Chart Coming Soon</div>
                  </div>
                  <div className="report-actions">
                    <button
                      className="btn small view-btn"
                      onClick={async () => {
                        setShowNonEligibleTable(false);
                        if (!showEligibleTable || eligibleStudents.length === 0) {
                          await fetchEligibleStudents();
                          window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                        }
                        setShowEligibleTable(true);
                      }}
                      disabled={loadingEligible}
                    >
                      {loadingEligible ? 'Loading...' : 'View Data'}
                    </button>
                    <button className="btn small" onClick={handleDownloadEligibleReport} disabled={eligibleStudents.length === 0}>
                      Download Report
                    </button>
                  </div>
                </div>
                
                {/* Non-Eligible Students Report */}
                <div className="report-card">
                  <h4>Non-Eligible Students</h4>
                  <div className="report-meta">
                    <p>Total Non-Eligible: <strong>{nonEligibleCount}</strong></p>
                  </div>
                  <div className="chart-container">
                    <div className="chart-placeholder">Chart Coming Soon</div>
                  </div>
                  <div className="report-actions">
                    <button
                      className="btn small view-btn"
                      onClick={async () => {
                        setShowEligibleTable(false);
                        if (!showNonEligibleTable || nonEligibleStudents.length === 0) {
                          await fetchNonEligibleStudents();
                          window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                        }
                        setShowNonEligibleTable(true);
                      }}
                      disabled={loadingNonEligible}
                    >
                      {loadingNonEligible ? 'Loading...' : 'View Data'}
                    </button>
                    <button className="btn small" onClick={handleDownloadNonEligibleReport} disabled={nonEligibleStudents.length === 0}>
                      Download Report
                    </button>
                  </div>
                </div>
              </div>

              {/* Eligible Students Table */}
              {showEligibleTable && (
<div className="table-wrap" style={{marginTop: '24px'}}>
                  <h3>Eligible Students List ({eligibleStudents.length})</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Contact</th>
                        <th>Education</th>
                        <th>School/College</th>
                        <th>Date Added</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eligibleStudents.map(s => (
                        <tr key={s.id}>
                          <td>{s.student_public_id || '-'}</td>
                          <td>{s.student_name || s.full_name}</td>
                          <td>{s.email}</td>
                          <td className="nowrap-cell">{s.contact || '-'}</td>
                          <td>{s.education || s.class}</td>
                          <td>{s.school || s.college || '-'}</td>
                          <td>
                            {s.created_at 
                              ? new Date(s.created_at).toLocaleDateString('en-IN') 
                              : '-'
                            }
                          </td>
                          <td>
                            <button 
                              className="btn small outline view-btn" 
                              style={{minWidth: '44px'}}
                              onClick={() => setViewEligibleStudent(s)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Non-Eligible Students Table */}
              {showNonEligibleTable && (
<div className="table-wrap" style={{marginTop: '24px'}}>
                  <h3>Non-Eligible Students List ({nonEligibleStudents.length})</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Contact</th>
                        <th>Education</th>
                        <th>School/College</th>
                        <th>Date Added</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nonEligibleStudents.map(s => (
                        <tr key={s.id}>
                          <td>{s.student_public_id || '-'}</td>
                          <td>{s.student_name || s.full_name}</td>
                          <td>{s.email}</td>
                          <td className="nowrap-cell">{s.contact || '-'}</td>
                          <td>{s.education || s.class}</td>
                          <td>{s.school || s.college || '-'}</td>
                          <td>
                            {s.created_at 
                              ? new Date(s.created_at).toLocaleDateString('en-IN') 
                              : '-'
                            }
                          </td>
                          <td>
                            <button 
                              className="btn small view-btn" 
                              onClick={() => setViewNonEligibleStudent(s)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                  <h4>👤 Profile Settings</h4>
                  <div className="settings-form">
                    <label>
                      Admin Name
                      <input 
                        type="text" 
                        className="form-input" 
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Enter admin name" 
                      />
                    </label>
                    <label>
                      Email Address
                      <input 
                        type="email" 
                        className="form-input" 
                        value={currentUser?.email || ""} 
                        readOnly 
                        placeholder="Email cannot be changed" 
                      />
                    </label>
                    <label>
                      Contact Number
                      <input 
                        type="tel" 
                        className="form-input" 
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="Enter contact number" 
                      />
                    </label>
                  </div>
                </div>
                
                <div className="settings-card">
                  <h4>🔔 Notification Preferences</h4> 
                  <div className="settings-form">
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={emailNotifications}
                        onChange={(e) => setEmailNotifications(e.target.checked)} 
                      /> Email Notifications
                    </label>
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={smsAlerts}
                        onChange={(e) => setSmsAlerts(e.target.checked)} 
                      /> SMS Alerts
                    </label>
                    <label className="checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={systemNotifications}
                        onChange={(e) => setSystemNotifications(e.target.checked)} 
                      /> System Notifications
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
  <div className="modal-overlay">
    <div className="modal">
      <h3>Student Details</h3>

      <div className="view-grid">

        {/* NAME */}
        <p><strong>Full Name:</strong> {viewStudent.full_name}</p>

        {/* BASIC INFO */}
        <p><strong>Age:</strong> {viewStudent.age}</p>
        {/* <p><strong>Address:</strong> {viewStudent.address}</p> */}
        {/* <p><strong>School / College:</strong> {viewStudent.school}</p> */}

        {/* CAMP INFO */}
        <p><strong>Camp Name:</strong> {viewStudent.campName || viewStudent.camp || '—'}</p>
        <p><strong>Camp Date:</strong> {viewStudent.campDate || '—'}</p>

        {/* EDUCATION */}
        <p><strong>Class / Year:</strong> {viewStudent.class || viewStudent.year || '—'}</p>
        <p><strong>School/College:</strong> {viewStudent.school || viewStudent.college || '—'}</p>

        {/* PERCENTAGES */}
        <p><strong>Previous %:</strong> {viewStudent.prev_percent || '—'}</p>
        <p><strong>Present %:</strong> {viewStudent.present_percent || '—'}</p>

        {/* CONTACT INFO */}
        <p><strong>Email:</strong> {viewStudent.email || '—'}</p>
        <p className="nowrap-cell"><strong>Contact:</strong> {viewStudent.contact || '—'}</p>
        <p className="nowrap-cell"><strong>WhatsApp:</strong> {viewStudent.whatsapp || '—'}</p>
        <p className="nowrap-cell"><strong>Student Contact:</strong> {viewStudent.student_contact || '—'}</p>

        {/* SCHOLARSHIP */}
        <p><strong>Scholarship Type:</strong> {viewStudent.scholarship}</p>
        <p><strong>Has Scholarship:</strong> {viewStudent.has_scholarship ? "Yes" : "No"}</p>
        <p><strong>Does Student Work?:</strong> {viewStudent.does_work ? "Yes" : "No"}</p>
        <p><strong>Earning Members:</strong> {viewStudent.earning_members}</p>

        {/* FEE DETAILS */}
        {/* <p><strong>Fee Amount:</strong> {viewStudent.fee}</p>
        <p><strong>Fee Structure:</strong> {viewStudent.fee_structure}</p>
        <p><strong>Paid Date:</strong> {viewStudent.paidDate}</p> */}

        {/* DONOR */}
        <p><strong>Volunteer:</strong> {viewStudent.volunteer_name}</p>

        {/* CREATED AT */}
        <p><strong>Record Created:</strong> 
          {formatToIST(viewStudent.created_at)}
        </p>

      </div>

      <button 
        className="btn primary" 
        style={{ marginTop: "20px" }} 
        onClick={() => setViewStudent(null)}
      >
        Close
      </button>
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
              <button className="btn" onClick={() => setViewDonor(null)}>Close</button>

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

      {viewDocumentsStudent && (
        <div className="modal-overlay" onClick={() => setViewDocumentsStudent(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '700px', maxHeight: '80vh', overflowY: 'auto'}}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ margin: 0 }}>
                {viewDocumentsStudent.student_name || viewDocumentsStudent.full_name}
              </h3>
            </div>

            {loadingDocs ? (
              <p style={{textAlign: 'center', padding: '2rem'}}>Loading documents...</p>
            ) : studentDocuments.length === 0 ? (
              <p style={{textAlign: 'center', padding: '2rem', color: '#666'}}>No documents found</p>
            ) : (
              <div style={{padding: '1rem 0'}}>
                {studentDocuments.map((doc) => (
                  <div key={doc.id} style={{borderBottom: '1px solid #e5e7eb', padding: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap'}}>
                    <div style={{minWidth: '220px', flex: '1 1 300px'}}>
                      <p style={{margin: '0 0 4px 0', fontWeight: 600}}>{doc.document_name || doc.file_name || 'Unnamed document'}</p>
                      <p style={{margin: '0', fontSize: '13px', color: '#444'}}><strong>File:</strong> {doc.file_name || 'N/A'}</p>
                      <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#666'}}><strong>Uploaded:</strong> {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'N/A'}</p>
                      <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#666'}}><strong>Status:</strong> {doc.is_checked ? 'Verified' : 'Pending'}</p>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px'}}>
                      {doc.file_url ? (
                        <a 
                          href={doc.file_url} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{backgroundColor: '#2e7d32', color: 'white', padding: '8px 16px', borderRadius: '4px', textDecoration: 'none', fontSize: '12px', whiteSpace: 'nowrap'}}
                        >
                          View/Download
                        </a>
                      ) : (
                        <span style={{fontSize: '12px', color: '#999'}}>No file URL</span>
                      )}
                      <span style={{fontSize: '12px', color: doc.is_checked ? '#2e7d32' : '#e65100', fontWeight: 600}}>
                        {doc.is_checked ? 'Verified' : 'Not verified'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button 
              className="btn primary" 
              onClick={() => setViewDocumentsStudent(null)}
              style={{marginTop: '1rem', width: '100%'}}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {viewEligibleStudent && (
        <div className="modal-overlay" onClick={() => setViewEligibleStudent(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Eligible Student Details</h3>
            <div className="view-grid">
              <p><strong>Full Name:</strong> {viewEligibleStudent.full_name || '-'}</p>
              <p><strong>Email:</strong> {viewEligibleStudent.email || '-'}</p>
              <p><strong>Contact:</strong> {viewEligibleStudent.contact || '-'}</p>
              <p><strong>Education Level:</strong> {viewEligibleStudent.class || '-'}</p>
              {/* <p><strong>Camp name:</strong> {viewEligibleStudent.year || '-'}</p> */}
              <p><strong>School:</strong> {viewEligibleStudent.school || '-'}</p>
              {/* <p><strong>College:</strong> {viewEligibleStudent.college || '-'}</p> */}
              <p><strong>Date Added:</strong> {formatToIST(viewEligibleStudent.created_at)}</p>
              <p><strong>Student ID:</strong> {viewEligibleStudent.student_public_id || '-'}</p>
              {viewEligibleStudent.reason && (
                <p><strong>Eligibility Reason:</strong> {viewEligibleStudent.reason}</p>
              )}
            </div>
            <div style={{display:'flex',gap:8,marginTop:12}}>
              <button className="btn primary" onClick={() => setViewEligibleStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {viewNonEligibleStudent && (
        <div className="modal-overlay" onClick={() => setViewNonEligibleStudent(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Non-Eligible Student Details</h3>
            <div className="view-grid">
              <p><strong>Full Name:</strong> {viewNonEligibleStudent.full_name || '-'}</p>
              <p><strong>Email:</strong> {viewNonEligibleStudent.email || '-'}</p>
              <p><strong>Contact:</strong> {viewNonEligibleStudent.contact || '-'}</p>
              <p><strong>Education Level:</strong> {viewNonEligibleStudent.class || '-'}</p>
              <p><strong>Camp Name:</strong> {viewNonEligibleStudent.camp_name || '-'}</p>
              <p><strong>School:</strong> {viewNonEligibleStudent.school || '-'}</p>
              
              <p><strong>Date Added:</strong> {formatToIST(viewNonEligibleStudent.created_at)}</p>
              <p><strong>Student ID:</strong> {viewNonEligibleStudent.student_public_id || '-'}</p>
            </div>
            <div style={{display:'flex',gap:8,marginTop:12}}>
              <button className="btn primary" onClick={() => setViewNonEligibleStudent(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
