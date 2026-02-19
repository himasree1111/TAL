import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../../supabaseClient";
import { toast } from "react-toastify";

export default function useAdminData() {
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
  const [defaultLanguage, setDefaultLanguage] = useState("English");
  const [timeZone, setTimeZone] = useState("IST (UTC+5:30)");
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [nonEligibleStudents, setNonEligibleStudents] = useState([]);
  const [loadingNonEligible, setLoadingNonEligible] = useState(false);
  const [nonEligibleCount, setNonEligibleCount] = useState(0);
  const [activeReportList, setActiveReportList] = useState(null);

  const [donorMappings, setDonorMappings] = useState([]);
  const [feePayments, setFeePayments] = useState([]);
  const [feeSummary, setFeeSummary] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastRecipient, setBroadcastRecipient] = useState("all");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [filteredFeeSummary, setFilteredFeeSummary] = useState(null);
  const [filteredDonationSummary, setFilteredDonationSummary] = useState(null);
  const [newDonorForm, setNewDonorForm] = useState({ student_id: "", donor_name: "", donor_email: "", year_of_support: "", amount: "" });
  const [newPaymentForm, setNewPaymentForm] = useState({ student_id: "", amount: "", payment_date: "", payment_method: "cash", notes: "" });
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [addStudentForm, setAddStudentForm] = useState({
    first_name: "", last_name: "", email: "", contact: "", whatsapp: "",
    dob: "", age: "", school: "", class: "", educationcategory: "",
    branch: "", address: "", camp_name: "", fee_structure: "",
    prev_percent: "", present_percent: "", father_name: "", mother_name: "",
    guardian_name: "", head_of_family: "", income_source: "", monthly_income: "",
    num_dependents: "", school_address: "",
  });
  const [editStudentModal, setEditStudentModal] = useState(null);

  const [filters, setFilters] = useState({ class: "", donor: "", feeStatus: "", stream: "" });
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [viewStudent, setViewStudent] = useState(null);
  const [viewStudentDocs, setViewStudentDocs] = useState([]);
  const [editStudent, setEditStudent] = useState(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [viewEligibleStudent, setViewEligibleStudent] = useState(null);
  const [viewNonEligibleStudent, setViewNonEligibleStudent] = useState(null);

  const transformStudents = (studentData) => {
    return (studentData || []).map((student, index) => ({
      id: student.id || index + 1,
      student_id: student.student_id || student.id,
      name: student.full_name,
      year: student.class,
      fee_status: student.fee_structure || "Not Provided",
      course: student.educationcategory || "",
      camp: student.camp_name,
      campDate: student.created_at
        ? new Date(student.created_at).toISOString().split("T")[0]
        : "",
      full_name: student.full_name,
      age: student.age,
      class: student.class,
      prev_percent: student.prev_percent,
      present_percent: student.present_percent,
      email: student.email,
      contact: student.contact,
      whatsapp: student.whatsapp,
      student_contact: student.student_contact,
      scholarship: student.scholarship,
      has_scholarship: student.has_scholarship,
      does_work: student.does_work,
      earning_members: student.earning_members,
      father_name: student.father_name,
      mother_name: student.mother_name,
      guardian_name: student.guardian_name,
      head_of_family: student.head_of_family,
      income_source: student.income_source,
      monthly_income: student.monthly_income,
      num_dependents: student.num_dependents,
      school_address: student.school_address,
      created_at: student.created_at,
    }));
  };

  const fetchEligibleCount = async () => {
    const { count, error } = await supabase
      .from("eligible_students")
      .select("*", { count: "exact", head: true });
    if (!error) setEligibleCount(count || 0);
  };

  const fetchNonEligibleCount = async () => {
    const { count, error } = await supabase
      .from("non_eligible_students")
      .select("*", { count: "exact", head: true });
    if (!error) setNonEligibleCount(count || 0);
  };

  const fetchEligibleStudents = async () => {
    setLoadingEligible(true);
    try {
      const { data, error } = await supabase
        .from("eligible_students")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error("Error fetching eligible students: " + error.message);
      } else {
        setEligibleStudents(data || []);
        setEligibleCount(data?.length || 0);
      }
    } catch (err) {
      toast.error("Error fetching data");
    } finally {
      setLoadingEligible(false);
    }
  };

  const fetchNonEligibleStudents = async () => {
    setLoadingNonEligible(true);
    try {
      const { data, error } = await supabase
        .from("non_eligible_students")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error("Error fetching non-eligible students: " + error.message);
      } else {
        setNonEligibleStudents(data || []);
        setNonEligibleCount(data?.length || 0);
      }
    } catch (err) {
      toast.error("Error fetching data");
    } finally {
      setLoadingNonEligible(false);
    }
  };

  const processDonorData = (donorData) => {
    const donorMap = {};
    donorData.forEach((dm) => {
      const key = dm.donor_email || dm.donor_name;
      if (!donorMap[key]) {
        donorMap[key] = { id: dm.id, name: dm.donor_name, amount: 0, years: dm.year_of_support || "N/A", students: 0, email: dm.donor_email };
      }
      donorMap[key].amount += parseFloat(dm.amount) || 0;
      donorMap[key].students += 1;
    });
    return Object.values(donorMap);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setCurrentUser(session.user);
          setAdminName(session.user.user_metadata?.name || session.user.email?.split("@")[0] || "");
        } else {
          navigate("/");
        }

        const { data: studentData, error: studentError } = await supabase
          .from("admin_student_info")
          .select("*")
          .order("created_at", { ascending: false });

        setLastFetch({ data: studentData || null, error: studentError || null, fetchedAt: new Date().toISOString() });

        if (!studentError) {
          setStudents(transformStudents(studentData));
        }

        const [donorRes, feeRes, notifRes] = await Promise.all([
          supabase.from("donor_mapping").select("*"),
          supabase.from("fee_payments").select("*"),
          supabase.from("notifications").select("*"),
        ]);

        if (donorRes.data) {
          setDonorMappings(donorRes.data);
          setDonors(processDonorData(donorRes.data));
        }
        if (feeRes.data) setFeePayments(feeRes.data);
        if (notifRes.data) setAdminNotifications(notifRes.data);

        try {
          const { data: summaryResp } = await (await import("axios")).default.get("/api/fee-payments/summary");
          if (summaryResp?.data) setFeeSummary(summaryResp.data);
        } catch (e) { /* silenced */ }
      } catch (error) { /* silenced */ } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchEligibleCount();
    fetchNonEligibleCount();
  }, [navigate]);

  const totals = useMemo(() => {
    const totalStudents = students.length;
    const feesCollected = feePayments.reduce((s, fp) => s + (parseFloat(fp.amount) || 0), 0);
    const pendingFees = feeSummary.filter((s) => s.status === "pending").length;
    const activeDonors = donors.length;
    return { totalStudents, feesCollected, pendingFees, activeDonors };
  }, [students, donors, feePayments, feeSummary]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (filters.class && s.year !== filters.class) return false;
      if (filters.donor) {
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

  const uniqueCourses = useMemo(() => {
    const set = new Set();
    students.forEach((s) => s.course && set.add(s.course));
    return Array.from(set);
  }, [students]);

  return {
    // State
    students, setStudents,
    donors, setDonors,
    viewDonor, setViewDonor,
    lastFetch,
    loading,
    currentUser, setCurrentUser,
    adminName, setAdminName,
    contactNumber, setContactNumber,
    emailNotifications, setEmailNotifications,
    smsAlerts, setSmsAlerts,
    systemNotifications, setSystemNotifications,
    defaultLanguage, setDefaultLanguage,
    timeZone, setTimeZone,
    eligibleStudents, setEligibleStudents,
    loadingEligible,
    eligibleCount,
    nonEligibleStudents, setNonEligibleStudents,
    loadingNonEligible,
    nonEligibleCount,
    activeReportList, setActiveReportList,
    donorMappings, setDonorMappings,
    feePayments, setFeePayments,
    feeSummary, setFeeSummary,
    adminNotifications, setAdminNotifications,
    broadcastTitle, setBroadcastTitle,
    broadcastMessage, setBroadcastMessage,
    broadcastRecipient, setBroadcastRecipient,
    reportStartDate, setReportStartDate,
    reportEndDate, setReportEndDate,
    filteredFeeSummary, setFilteredFeeSummary,
    filteredDonationSummary, setFilteredDonationSummary,
    newDonorForm, setNewDonorForm,
    newPaymentForm, setNewPaymentForm,
    showAddStudentModal, setShowAddStudentModal,
    addStudentForm, setAddStudentForm,
    editStudentModal, setEditStudentModal,
    filters, setFilters,
    query, setQuery,
    activeSection, setActiveSection,
    viewStudent, setViewStudent,
    viewStudentDocs, setViewStudentDocs,
    editStudent, setEditStudent,
    broadcastOpen, setBroadcastOpen,
    viewEligibleStudent, setViewEligibleStudent,
    viewNonEligibleStudent, setViewNonEligibleStudent,
    // Computed
    totals,
    filteredStudents,
    uniqueCourses,
    // Functions
    transformStudents,
    processDonorData,
    fetchEligibleStudents,
    fetchNonEligibleStudents,
    fetchEligibleCount,
    fetchNonEligibleCount,
  };
}
