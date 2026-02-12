import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import supabase from "./supabaseClient";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
  const [defaultLanguage, setDefaultLanguage] = useState("English");
  const [timeZone, setTimeZone] = useState("IST (UTC+5:30)");
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(false);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [nonEligibleStudents, setNonEligibleStudents] = useState([]);
  const [loadingNonEligible, setLoadingNonEligible] = useState(false);
  const [nonEligibleCount, setNonEligibleCount] = useState(0);
  // const [viewEligibleStudent, setViewEligibleStudent] = useState(null);
  const [activeReportList, setActiveReportList] = useState(null);

  // Real data from new backend endpoints
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

        // Fetch student form submissions
       const { data: studentData, error: studentError } = await supabase
  .from('admin_student_info')
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
    student_id: student.student_id || student.id,  // VERY IMPORTANT

    /* TABLE COLUMNS */
    name: student.full_name,           // Name column
    // college: student.school,           // College column
    year: student.class,               // Year column
   // donor: student.volunteer_email || "None",
    fee_status: student.fee_structure || "Not Provided",
    course: student.educationcategory || "",
    camp: student.camp_name,
    campDate: student.created_at
      ? new Date(student.created_at).toISOString().split("T")[0]
      : "",

    /* VIEW MODAL FIELDS */
    full_name: student.full_name,
    age: student.age,
    // address: student.address,
    // school: student.school,
    class: student.class,
    // branch: student.branch,
    // certificates: student.certificates,
    prev_percent: student.prev_percent,
    present_percent: student.present_percent,

    /* Contacts */
    email: student.email,
    contact: student.contact,
    whatsapp: student.whatsapp,
    student_contact: student.student_contact,

    /* Scholarship */
    scholarship: student.scholarship,
    has_scholarship: student.has_scholarship,
    does_work: student.does_work,
    earning_members: student.earning_members,

    /* Family & Income */
    father_name: student.father_name,
    mother_name: student.mother_name,
    guardian_name: student.guardian_name,
    head_of_family: student.head_of_family,
    income_source: student.income_source,
    monthly_income: student.monthly_income,
    num_dependents: student.num_dependents,
    school_address: student.school_address,

    /* Other */
    created_at: student.created_at
}));


     setStudents(transformedStudents);
        }

        // Fetch real donor mappings, fee summary, and notifications
        const [donorRes, feeRes, notifRes] = await Promise.all([
          supabase.from("donor_mapping").select("*"),
          supabase.from("fee_payments").select("*"),
          supabase.from("notifications").select("*"),
        ]);

        if (donorRes.data) {
          setDonorMappings(donorRes.data);
          // Group donors by name for the donors list
          const donorMap = {};
          donorRes.data.forEach((dm) => {
            const key = dm.donor_email || dm.donor_name;
            if (!donorMap[key]) {
              donorMap[key] = { id: dm.id, name: dm.donor_name, amount: 0, years: dm.year_of_support || "N/A", students: 0, email: dm.donor_email };
            }
            donorMap[key].amount += parseFloat(dm.amount) || 0;
            donorMap[key].students += 1;
          });
          setDonors(Object.values(donorMap));
        }

        if (feeRes.data) setFeePayments(feeRes.data);
        if (notifRes.data) setAdminNotifications(notifRes.data);

        // Fetch fee payment summary
        try {
          const { data: summaryResp } = await (await import("axios")).default.get("/api/fee-payments/summary");
          if (summaryResp?.data) setFeeSummary(summaryResp.data);
        } catch (e) {
          console.error("Fee summary fetch error:", e);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

   fetchUserData();
fetchEligibleCount();
fetchNonEligibleCount();
}, []);


  // filters now include stream (course)
  const [filters, setFilters] = useState({ class: "", donor: "", feeStatus: "", stream: "" });
  const [query, setQuery] = useState("");

  const [activeSection, setActiveSection] = useState("overview");
  const [viewStudent, setViewStudent] = useState(null);
  const [viewStudentDocs, setViewStudentDocs] = useState([]);
  const [editStudent, setEditStudent] = useState(null);
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [viewEligibleStudent, setViewEligibleStudent] = useState(null);
  const [viewNonEligibleStudent, setViewNonEligibleStudent] = useState(null);

  const totals = useMemo(() => {
    const totalStudents = students.length;
    const feesCollected = feePayments.reduce((s, fp) => s + (parseFloat(fp.amount) || 0), 0);
    const pendingFees = feeSummary.filter((s) => s.status === "pending").length;
    const activeDonors = donors.length;
    return { totalStudents, feesCollected, pendingFees, activeDonors };
  }, [students, donors, feePayments, feeSummary]);

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

  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Delete this student record? This cannot be undone.")) return;
    const { error } = await supabase
      .from("student_form_submissions")
      .delete()
      .eq("id", id);
    if (error) {
      alert("Delete failed: " + error.message);
      return;
    }
    setStudents((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddStudent = async () => {
    const f = addStudentForm;
    if (!f.first_name || !f.last_name || !f.email) {
      alert("First name, last name, and email are required.");
      return;
    }
    const payload = {
      ...f,
      age: parseInt(f.age) || null,
      prev_percent: parseFloat(f.prev_percent) || null,
      present_percent: parseFloat(f.present_percent) || null,
      monthly_income: parseFloat(f.monthly_income) || null,
      num_dependents: parseInt(f.num_dependents) || null,
      volunteer_email: currentUser?.email || null,
      submitted_by: "admin",
    };
    const { data, error } = await supabase
      .from("student_form_submissions")
      .insert([payload]);
    if (error) {
      alert("Error adding student: " + error.message);
      return;
    }
    alert("Student added successfully!");
    setShowAddStudentModal(false);
    setAddStudentForm({
      first_name: "", last_name: "", email: "", contact: "", whatsapp: "",
      dob: "", age: "", school: "", class: "", educationcategory: "",
      branch: "", address: "", camp_name: "", fee_structure: "",
      prev_percent: "", present_percent: "", father_name: "", mother_name: "",
      guardian_name: "", head_of_family: "", income_source: "", monthly_income: "",
      num_dependents: "", school_address: "",
    });
    // Refresh student list
    const { data: refreshed } = await supabase.from("admin_student_info").select("*").order("created_at", { ascending: false });
    if (refreshed) {
      const transformedStudents = refreshed.map((student, index) => ({
        id: student.id || index + 1,
        student_id: student.student_id || student.id,
        name: student.full_name,
        year: student.class,
        fee_status: student.fee_structure || "Not Provided",
        course: student.educationcategory || "",
        camp: student.camp_name,
        campDate: student.created_at ? new Date(student.created_at).toISOString().split("T")[0] : "",
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
      setStudents(transformedStudents);
    }
  };

  const handleEditStudentSave = async () => {
    if (!editStudentModal) return;
    const { id, ...fields } = editStudentModal;
    const payload = {};
    // Only send fields that have values
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined && val !== "") payload[key] = val;
    }
    const { error } = await supabase
      .from("student_form_submissions")
      .update(payload)
      .eq("id", id);
    if (error) {
      alert("Error updating student: " + error.message);
      return;
    }
    // Update local state
    setStudents((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      return {
        ...s,
        name: `${fields.first_name || ""} ${fields.last_name || ""}`.trim() || s.name,
        email: fields.email || s.email,
        contact: fields.contact || s.contact,
        year: fields.class || s.year,
        course: fields.educationcategory || s.course,
        ...fields,
      };
    }));
    setEditStudentModal(null);
    alert("Student updated successfully!");
  };

  // helpers
  const uniqueCourses = useMemo(() => {
    const set = new Set();
    students.forEach(s => s.course && set.add(s.course));
    return Array.from(set);
  }, [students]);

const handleApprove = async (id) => {
  const { error } = await supabase
    .from('admin_student_info')
    .update({ status: 'Eligible' })
    .eq('id', id);

  if (error) {
    console.error(error);
    alert('Approval failed');
    return;
  }

  // 👇 remove from UI immediately
  setStudents(prev => prev.filter(s => s.id !== id));

  alert('Student approved ✅');
};


const handleNotApprove = async (id) => {
  const { error } = await supabase
    .from('admin_student_info')
    .update({ status: 'Not Eligible' })
    .eq('id', id);

  if (error) {
    console.error(error);
    alert('Rejection failed');
    return;
  }

  // remove from UI
  setStudents(prev => prev.filter(s => s.id !== id));

  alert('Student rejected ❌');
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

  // --- Handlers using real API ---
  const handleAddDonor = async () => {
    if (!newDonorForm.student_id || !newDonorForm.donor_name) {
      alert("Student ID and Donor Name are required");
      return;
    }
    try {
      const { data, error } = await supabase.from("donor_mapping").insert({
        student_id: parseInt(newDonorForm.student_id),
        donor_name: newDonorForm.donor_name,
        donor_email: newDonorForm.donor_email || null,
        year_of_support: newDonorForm.year_of_support || null,
        amount: parseFloat(newDonorForm.amount) || 0,
      });
      if (error) { alert("Error: " + error.message); return; }
      // Refresh donor mappings
      const { data: refreshed } = await supabase.from("donor_mapping").select("*");
      if (refreshed) {
        setDonorMappings(refreshed);
        const donorMap = {};
        refreshed.forEach((dm) => {
          const key = dm.donor_email || dm.donor_name;
          if (!donorMap[key]) donorMap[key] = { id: dm.id, name: dm.donor_name, amount: 0, years: dm.year_of_support || "N/A", students: 0, email: dm.donor_email };
          donorMap[key].amount += parseFloat(dm.amount) || 0;
          donorMap[key].students += 1;
        });
        setDonors(Object.values(donorMap));
      }
      setNewDonorForm({ student_id: "", donor_name: "", donor_email: "", year_of_support: "", amount: "" });
      alert("Donor mapping added successfully!");
    } catch (err) {
      alert("Error adding donor: " + err.message);
    }
  };

  const handleDeleteDonorMapping = async (id) => {
    if (!window.confirm("Remove this donor mapping?")) return;
    try {
      await supabase.from("donor_mapping").delete().eq("id", id);
      setDonorMappings((prev) => prev.filter((dm) => dm.id !== id));
    } catch (err) {
      alert("Error: " + err.message);
    }
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

  const handleDownloadFeeReport = () => {
    if (feeSummary.length === 0) { alert("No fee data to export"); return; }
    const rows = ['student_id,student_name,total_fee,total_paid,balance,status',
      ...feeSummary.map(s => `${s.student_id},"${s.student_name}",${s.total_fee},${s.total_paid},${s.balance},${s.status}`)
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fee-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRecordPayment = async () => {
    if (!newPaymentForm.student_id || !newPaymentForm.amount || !newPaymentForm.payment_date) {
      alert("Student ID, Amount, and Date are required");
      return;
    }
    try {
      const { error } = await supabase.from("fee_payments").insert({
        student_id: parseInt(newPaymentForm.student_id),
        amount: parseFloat(newPaymentForm.amount),
        payment_date: newPaymentForm.payment_date,
        payment_method: newPaymentForm.payment_method,
        notes: newPaymentForm.notes || null,
      });
      if (error) { alert("Error: " + error.message); return; }
      // Refresh fee data
      const { data: refreshedFees } = await supabase.from("fee_payments").select("*");
      if (refreshedFees) setFeePayments(refreshedFees);
      try {
        const { data: summaryResp } = await (await import("axios")).default.get("/api/fee-payments/summary");
        if (summaryResp?.data) setFeeSummary(summaryResp.data);
      } catch (e) { console.error(e); }
      setNewPaymentForm({ student_id: "", amount: "", payment_date: "", payment_method: "cash", notes: "" });
      alert("Payment recorded successfully!");
    } catch (err) {
      alert("Error recording payment: " + err.message);
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm("Delete this payment record?")) return;
    try {
      await supabase.from("fee_payments").delete().eq("id", id);
      setFeePayments((prev) => prev.filter((fp) => fp.id !== id));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTitle) { alert("Title is required"); return; }
    try {
      const { data: resp } = await (await import("axios")).default.post(
        "/api/notifications/broadcast",
        {
          recipient_role: broadcastRecipient === "all" ? null : broadcastRecipient,
          title: broadcastTitle,
          message: broadcastMessage,
          type: "broadcast",
          priority: "medium",
          created_by: currentUser?.email,
        }
      );
      if (resp?.error) { alert("Error: " + resp.error.message); return; }
      alert(`Broadcast sent to ${resp?.data?.count || 0} recipients!`);
      setBroadcastTitle("");
      setBroadcastMessage("");
      // Refresh notifications
      const { data: refreshed } = await supabase.from("notifications").select("*");
      if (refreshed) setAdminNotifications(refreshed);
    } catch (err) {
      alert("Error sending broadcast: " + err.message);
    }
  };

  const handleDeleteNotification = async (id) => {
    if (!window.confirm("Delete this notification?")) return;
    try {
      await supabase.from("notifications").delete().eq("id", id);
      setAdminNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportStartDate && !reportEndDate) {
      setFilteredFeeSummary(null);
      setFilteredDonationSummary(null);
      alert("Set a date range to filter reports, or reports show all-time data.");
      return;
    }
    try {
      const axios = (await import("axios")).default;
      const params = new URLSearchParams();
      if (reportStartDate) params.set("start_date", reportStartDate);
      if (reportEndDate) params.set("end_date", reportEndDate);
      const [feeRes, donationRes] = await Promise.all([
        axios.get(`/api/fee-payments/summary?${params}`),
        axios.get(`/api/donations/summary?${params}`),
      ]);
      if (feeRes.data?.data) setFilteredFeeSummary(feeRes.data.data);
      if (donationRes.data?.data) setFilteredDonationSummary(donationRes.data.data);
      alert("Reports filtered for date range: " + (reportStartDate || "start") + " to " + (reportEndDate || "end"));
    } catch (err) {
      alert("Error filtering reports.");
    }
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

  const exportPDF = (title, columns, rows, filename) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(29, 43, 74);
    doc.text("Touch A Life Foundation", 14, 15);
    doc.setFontSize(12);
    doc.setTextColor(42, 104, 107);
    doc.text(title, 14, 24);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.autoTable({
      startY: 35,
      head: [columns],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [29, 43, 74], textColor: 255 },
      alternateRowStyles: { fillColor: [246, 248, 250] },
    });
    doc.save(filename);
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

  // When opening edit modal, create a shallow copy so editing doesn't mutate state directly
  const openEditModal = (s) => {
    setEditStudent({ ...s });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
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
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
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
                  <button className="btn primary" onClick={() => setShowAddStudentModal(true)}>+ Add Student</button>
                  <button className="btn primary" onClick={exportCSV}>Export CSV</button>
                  <button className="btn primary" style={{ marginLeft: "4px" }} onClick={() => {
                    exportPDF("Beneficiaries Report", ["ID", "Name", "College", "Year", "Donor", "Fee Status"],
                      students.map(s => [s.id, s.name, s.college, s.year, s.donor, s.feeStatus]),
                      "beneficiaries.pdf");
                  }}>Export PDF</button>
                </div>
              </div>

              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Education</th>
                
                      {/* <th>Fee Status</th> */}
                      <th>Contact</th>         {/* NEW column (stream) */}
                      <th>Camp</th>           {/* NEW column (campName / campDate) */}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(s => (
                      <tr key={s.id}>
                        <td>{s.name}</td>
                        <td>{s.email}</td>
                        <td>{s.year}</td>
                    
                        {/* <td>{s.feeStatus}</td> */}
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
                              <button className="btn small icon-btn" onClick={async () => { setViewStudent(s); try { const axios = (await import("axios")).default; const { data: docsResp } = await axios.get(`/api/documents?student_id=${s.id}`); setViewStudentDocs(docsResp?.data || []); } catch(e) { setViewStudentDocs([]); } }} style={{backgroundColor: '#e3f2fd', color: '#1976d2', borderColor: '#1976d2'}}>👁️</button>
                              <span className="tooltiptext">View</span>
                            </div>
                            <div className="tooltip">
                              <button className="btn small icon-btn" onClick={() => setEditStudentModal({ id: s.id, first_name: s.name?.split(" ")[0] || "", last_name: s.name?.split(" ").slice(1).join(" ") || "", email: s.email || "", contact: s.contact || "", school: s.school || "", class: s.class || s.year || "", educationcategory: s.course || "", fee_structure: s.fee_status || "", address: s.address || "", father_name: s.father_name || "", mother_name: s.mother_name || "", guardian_name: s.guardian_name || "", head_of_family: s.head_of_family || "", income_source: s.income_source || "", monthly_income: s.monthly_income || "", num_dependents: s.num_dependents || "", school_address: s.school_address || "" })} style={{backgroundColor: '#fff3e0', color: '#e65100', borderColor: '#e65100'}}>✎</button>
                              <span className="tooltiptext">Edit</span>
                            </div>
                            <div className="tooltip">
                              <button className="btn small icon-btn" onClick={() => handleApprove(s.id)} style={{backgroundColor: '#e8f5e8', color: '#2e7d32', borderColor: '#2e7d32'}}>✅</button>
                              <span className="tooltiptext">Approved</span>
                            </div>
                            <div className="tooltip">
                              <button className="btn small icon-btn" onClick={() => handleNotApprove(s.id)} style={{backgroundColor: '#ffebee', color: '#c62828', borderColor: '#c62828'}}>❌</button>
                              <span className="tooltiptext">Not Approved</span>
                            </div>
                            <div className="tooltip">
                              <button className="btn small icon-btn" onClick={() => handleDeleteStudent(s.id)} style={{backgroundColor: '#ffebee', color: '#c62828', borderColor: '#c62828'}}>🗑</button>
                              <span className="tooltiptext">Delete</span>
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

          {/* Donor Mapping */}
          {activeSection === "mapping" && (
            <section className="mapping-section">
              <div className="section-header">
                <h3>Donor Mapping</h3>
                <div className="section-actions">
                  <button className="btn primary" onClick={handleExportDonorReport}>Export Report</button>
                </div>
              </div>

              <div className="mapping-stats">
                <div className="stat-box">
                  <div className="value">{"\u20B9"}{donorMappings.reduce((s,d) => s + (parseFloat(d.amount) || 0), 0).toLocaleString()}</div>
                  <div className="label">Total Funds Mapped</div>
                </div>
                <div className="stat-box">
                  <div className="value">{new Set(donorMappings.map(d => d.student_id)).size}</div>
                  <div className="label">Students Supported</div>
                </div>
                <div className="stat-box">
                  <div className="value">{donors.length}</div>
                  <div className="label">Active Donors</div>
                </div>
              </div>

              {/* Add New Donor Mapping Form */}
              <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '12px' }}>Add New Donor Mapping</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85em' }}>
                    Student ID
                    <input className="form-input" value={newDonorForm.student_id} onChange={(e) => setNewDonorForm(f => ({...f, student_id: e.target.value}))} placeholder="e.g. 1" style={{ width: '80px' }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85em' }}>
                    Donor Name *
                    <input className="form-input" value={newDonorForm.donor_name} onChange={(e) => setNewDonorForm(f => ({...f, donor_name: e.target.value}))} placeholder="Name" />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85em' }}>
                    Donor Email
                    <input className="form-input" value={newDonorForm.donor_email} onChange={(e) => setNewDonorForm(f => ({...f, donor_email: e.target.value}))} placeholder="email@example.com" />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85em' }}>
                    Year
                    <input className="form-input" value={newDonorForm.year_of_support} onChange={(e) => setNewDonorForm(f => ({...f, year_of_support: e.target.value}))} placeholder="2025-2026" style={{ width: '100px' }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85em' }}>
                    Amount
                    <input className="form-input" type="number" value={newDonorForm.amount} onChange={(e) => setNewDonorForm(f => ({...f, amount: e.target.value}))} placeholder="0" style={{ width: '100px' }} />
                  </label>
                  <button className="btn primary" onClick={handleAddDonor}>Add Mapping</button>
                </div>
              </div>

              <div className="mapping-grid">
                {donors.map(d => (
                  <div key={d.id} className="map-card">
                    <div className="map-name">{d.name}</div>
                    <div className="map-stats">
                      <div className="map-stat">
                        <div className="label">Total Amount</div>
                        <div className="value">{"\u20B9"}{(d.amount || 0).toLocaleString()}</div>
                      </div>
                      <div className="map-stat">
                        <div className="label">Duration</div>
                        <div className="value">{d.years}</div>
                      </div>
                      <div className="map-stat">
                        <div className="label">Students</div>
                        <div className="value">{d.students}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <button className="btn small" onClick={() => setViewDonor(d)}>View Details</button>
                      {d.email && (
                        <button className="btn small" style={{ marginLeft: '8px' }} onClick={() => handleContactDonor(d)}>Contact</button>
                      )}
                    </div>
                  </div>
                ))}
                {donors.length === 0 && <p style={{ color: '#888' }}>No donor mappings yet. Add one above.</p>}
              </div>

              {/* Individual Mappings Table */}
              {donorMappings.length > 0 && (
                <div className="table-wrap" style={{ marginTop: '20px' }}>
                  <h4>All Donor-Student Mappings</h4>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Donor</th>
                        <th>Student</th>
                        <th>Amount</th>
                        <th>Year</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {donorMappings.map(dm => (
                        <tr key={dm.id}>
                          <td>{dm.donor_name}</td>
                          <td>{dm.student_name || `#${dm.student_id}`}</td>
                          <td>{"\u20B9"}{(parseFloat(dm.amount) || 0).toLocaleString()}</td>
                          <td>{dm.year_of_support || "N/A"}</td>
                          <td><span style={{ color: dm.is_current_sponsor ? '#2e7d32' : '#888' }}>{dm.is_current_sponsor ? "Active" : "Past"}</span></td>
                          <td>
                            <button className="btn small" style={{ color: '#c62828' }} onClick={() => handleDeleteDonorMapping(dm.id)}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Fee Tracking */}
          {activeSection === "fees" && (
            <section className="fees-section">
              <div className="section-header">
                <h3>Fee Tracking</h3>
                <div className="section-actions">
                  <button className="btn" onClick={handleDownloadFeeReport}>Download Report</button>
                </div>
              </div>

              <div className="fee-summary">
                <div className="fee-card">
                  <div className="amount">{"\u20B9"}{feeSummary.reduce((s,f) => s + (f.total_fee || 0), 0).toLocaleString()}</div>
                  <div className="label">Total Fees</div>
                </div>
                <div className="fee-card">
                  <div className="amount">{"\u20B9"}{feePayments.reduce((s,fp) => s + (parseFloat(fp.amount) || 0), 0).toLocaleString()}</div>
                  <div className="label">Collected</div>
                </div>
                <div className="fee-card">
                  <div className="amount">{"\u20B9"}{feeSummary.reduce((s,f) => s + Math.max(0, f.balance || 0), 0).toLocaleString()}</div>
                  <div className="label">Pending</div>
                </div>
                <div className="fee-card">
                  <div className="amount">
                    {feeSummary.length > 0
                      ? Math.round((feeSummary.filter(f => f.status === "paid").length / feeSummary.length) * 100) + "%"
                      : "0%"}
                  </div>
                  <div className="label">Fully Paid Rate</div>
                </div>
              </div>

              {/* Record New Payment Form */}
              <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '12px' }}>Record New Payment</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85em' }}>
                    Student ID *
                    <input className="form-input" value={newPaymentForm.student_id} onChange={(e) => setNewPaymentForm(f => ({...f, student_id: e.target.value}))} placeholder="e.g. 1" style={{ width: '80px' }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85em' }}>
                    Amount *
                    <input className="form-input" type="number" value={newPaymentForm.amount} onChange={(e) => setNewPaymentForm(f => ({...f, amount: e.target.value}))} placeholder="0" style={{ width: '100px' }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85em' }}>
                    Date *
                    <input className="form-input" type="date" value={newPaymentForm.payment_date} onChange={(e) => setNewPaymentForm(f => ({...f, payment_date: e.target.value}))} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85em' }}>
                    Method
                    <select className="form-input" value={newPaymentForm.payment_method} onChange={(e) => setNewPaymentForm(f => ({...f, payment_method: e.target.value}))}>
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85em' }}>
                    Notes
                    <input className="form-input" value={newPaymentForm.notes} onChange={(e) => setNewPaymentForm(f => ({...f, notes: e.target.value}))} placeholder="Optional" />
                  </label>
                  <button className="btn primary" onClick={handleRecordPayment}>Record Payment</button>
                </div>
              </div>

              {/* Fee Summary per Student */}
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Total Fee</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feeSummary.map(s => (
                      <tr key={s.student_id}>
                        <td>{s.student_name || `#${s.student_id}`}</td>
                        <td>{"\u20B9"}{(s.total_fee || 0).toLocaleString()}</td>
                        <td>{"\u20B9"}{(s.total_paid || 0).toLocaleString()}</td>
                        <td>{"\u20B9"}{(s.balance || 0).toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${s.status}`}>
                            {s.status === "paid" ? "Paid" : s.status === "partial" ? "Partial" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {feeSummary.length === 0 && (
                      <tr><td colSpan="5" style={{ textAlign: 'center', color: '#888' }}>No fee data available</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Recent Payments */}
              {feePayments.length > 0 && (
                <div className="table-wrap" style={{ marginTop: '20px' }}>
                  <h4>Recent Payments</h4>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Method</th>
                        <th>Notes</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feePayments.slice(0, 20).map(fp => (
                        <tr key={fp.id}>
                          <td>#{fp.student_id}</td>
                          <td>{"\u20B9"}{(parseFloat(fp.amount) || 0).toLocaleString()}</td>
                          <td>{fp.payment_date}</td>
                          <td>{fp.payment_method}</td>
                          <td>{fp.notes || "-"}</td>
                          <td>
                            <button className="btn small" style={{ color: '#c62828' }} onClick={() => handleDeletePayment(fp.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
          {/* Alerts & Broadcast */}
          {activeSection === "broadcast" && (
            <section className="broadcast-section">
              <div className="section-header">
                <h3>Alerts & Broadcasts</h3>
              </div>

              {/* Send New Notification */}
              <div style={{ background: '#f9f9f9', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
                <h4 style={{ marginBottom: '12px' }}>Send New Notification</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '500px' }}>
                  <label style={{ fontSize: '0.85em' }}>
                    Title *
                    <input className="form-input" value={broadcastTitle} onChange={(e) => setBroadcastTitle(e.target.value)} placeholder="Notification title" />
                  </label>
                  <label style={{ fontSize: '0.85em' }}>
                    Message
                    <textarea className="form-input" rows={3} value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} placeholder="Message body" />
                  </label>
                  <label style={{ fontSize: '0.85em' }}>
                    Recipients
                    <select className="form-input" value={broadcastRecipient} onChange={(e) => setBroadcastRecipient(e.target.value)}>
                      <option value="all">All Users</option>
                      <option value="student">All Students</option>
                      <option value="donor">All Donors</option>
                      <option value="volunteer">All Volunteers</option>
                    </select>
                  </label>
                  <button className="btn primary" style={{ alignSelf: 'flex-start' }} onClick={handleSendBroadcast}>Send Broadcast</button>
                </div>
              </div>

              {/* Quick Templates */}
              <div className="broadcast-types">
                <div className="broadcast-card">
                  <h4>Fee Reminders</h4>
                  <p>Send automated reminders for fee payments</p>
                  <button className="btn" onClick={() => { setBroadcastTitle("Fee Payment Reminder"); setBroadcastMessage("This is a reminder to submit your pending fee payments."); setBroadcastRecipient("student"); }}>Use Template</button>
                </div>
                <div className="broadcast-card">
                  <h4>Event Announcements</h4>
                  <p>Broadcast upcoming events and activities</p>
                  <button className="btn" onClick={() => { setBroadcastTitle("Upcoming Event"); setBroadcastMessage(""); setBroadcastRecipient("all"); }}>Use Template</button>
                </div>
                <div className="broadcast-card">
                  <h4>Document Requests</h4>
                  <p>Request necessary documents from students</p>
                  <button className="btn" onClick={() => { setBroadcastTitle("Document Submission Required"); setBroadcastMessage("Please submit the required documents at your earliest convenience."); setBroadcastRecipient("student"); }}>Use Template</button>
                </div>
              </div>

              {/* Notification History */}
              <div className="broadcast-history">
                <h4>Recent Notifications ({adminNotifications.length})</h4>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Title</th>
                        <th>Message</th>
                        <th>Recipient</th>
                        <th>Type</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminNotifications.slice(0, 20).map(n => (
                        <tr key={n.id}>
                          <td>{n.created_at ? new Date(n.created_at).toLocaleDateString() : "-"}</td>
                          <td>{n.title}</td>
                          <td>{n.message || "-"}</td>
                          <td>{n.recipient_email || n.recipient_role || "All"}</td>
                          <td>{n.type}</td>
                          <td>
                            <button className="btn small" style={{ color: '#c62828' }} onClick={() => handleDeleteNotification(n.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                      {adminNotifications.length === 0 && (
                        <tr><td colSpan="6" style={{ textAlign: 'center', color: '#888' }}>No notifications sent yet</td></tr>
                      )}
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
                <div className="section-actions" style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <label style={{ fontSize: "0.85em" }}>From: <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} /></label>
                  <label style={{ fontSize: "0.85em" }}>To: <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} /></label>
                  <button className="btn primary" onClick={handleGenerateReport}>Filter Reports</button>
                  {(filteredFeeSummary || filteredDonationSummary) && (
                    <button className="btn" onClick={() => { setFilteredFeeSummary(null); setFilteredDonationSummary(null); setReportStartDate(""); setReportEndDate(""); }}>Clear Filter</button>
                  )}
                </div>
              </div>

              <div className="reports-grid">
                <div className="report-card">
                  <h4>Financial Overview {filteredFeeSummary ? "(Filtered)" : ""}</h4>
                  <div className="report-meta">
                    {(() => {
                      const data = filteredFeeSummary || feeSummary;
                      return (<>
                        <p>Total Fees: <strong>{"\u20B9"}{data.reduce((s,f) => s + (f.total_fee || 0), 0).toLocaleString()}</strong></p>
                        <p>Collected: <strong>{"\u20B9"}{data.reduce((s,f) => s + (f.total_paid || 0), 0).toLocaleString()}</strong></p>
                        <p>Pending: <strong>{"\u20B9"}{data.reduce((s,f) => s + Math.max(0, f.balance || 0), 0).toLocaleString()}</strong></p>
                      </>);
                    })()}
                  </div>
                  <button className="btn small" onClick={handleDownloadFeeReport}>Download CSV</button>
                  <button className="btn small" style={{ marginLeft: "4px" }} onClick={() => {
                    const data = filteredFeeSummary || feeSummary;
                    exportPDF("Financial Overview", ["Student", "Total Fee", "Paid", "Balance", "Status"],
                      data.map(f => [f.student_name || f.student_id, f.total_fee || 0, f.total_paid || 0, f.balance || 0, f.status]),
                      "financial_overview.pdf");
                  }}>Export PDF</button>
                </div>

                <div className="report-card">
                  <h4>Donor Contributions {filteredDonationSummary ? "(Filtered)" : ""}</h4>
                  <div className="report-meta">
                    {filteredDonationSummary ? (<>
                      <p>Total Donated: <strong>{"\u20B9"}{(filteredDonationSummary.total || 0).toLocaleString()}</strong></p>
                      <p>Unique Donors: <strong>{filteredDonationSummary.byDonor?.length || 0}</strong></p>
                      <p>Months: <strong>{filteredDonationSummary.byMonth?.length || 0}</strong></p>
                    </>) : (<>
                      <p>Total Donors: <strong>{donors.length}</strong></p>
                      <p>Total Mapped: <strong>{"\u20B9"}{donorMappings.reduce((s,d) => s + (parseFloat(d.amount) || 0), 0).toLocaleString()}</strong></p>
                      <p>Students Supported: <strong>{new Set(donorMappings.map(d => d.student_id)).size}</strong></p>
                    </>)}
                  </div>
                  <button className="btn small" onClick={handleExportDonorReport}>Download CSV</button>
                  <button className="btn small" style={{ marginLeft: "4px" }} onClick={() => {
                    exportPDF("Donor Contributions", ["ID", "Name", "Amount", "Years"],
                      donors.map(d => [d.id, d.name, d.amount, d.years]),
                      "donor_contributions.pdf");
                  }}>Export PDF</button>
                </div>
                {/* Eligible Students Report */}
                <div className="report-card">
                  <h4>Eligible Students</h4>
                  <div className="report-meta">
                     <p>Total Eligible: <strong>{eligibleCount}</strong></p>
                  </div>
                  <div className="report-actions">
<button
  className="btn small"
  onClick={() => {
    setActiveReportList("eligible");
    fetchEligibleStudents();
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 200);
  }}
  disabled={loadingEligible}
>
                      {loadingEligible ? 'Loading...' : 'View Data'}
                    </button>
                    <button className="btn small" onClick={handleDownloadEligibleReport} disabled={eligibleStudents.length === 0}>
                      Download CSV
                    </button>
                    <button className="btn small" style={{ marginLeft: "4px" }} disabled={eligibleStudents.length === 0} onClick={() => {
                      exportPDF("Eligible Students", ["ID", "Name", "Email", "Contact", "Education", "School"],
                        eligibleStudents.map(s => [s.id, s.student_name || "", s.email || "", s.contact || "", s.education || "", s.school || s.college || ""]),
                        "eligible_students.pdf");
                    }}>Export PDF</button>
                  </div>
                </div>
                
                {/* Non-Eligible Students Report */}
                <div className="report-card">
                  <h4>Non-Eligible Students</h4>
                  <div className="report-meta">
                     <p>Total Non-Eligible: <strong>{nonEligibleCount}</strong></p>
                  </div>
                  <div className="report-actions">
<button
  className="btn small"
  onClick={() => {
    setActiveReportList("nonEligible");
    fetchNonEligibleStudents();
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 200);
  }}
  disabled={loadingNonEligible}
>
                      {loadingNonEligible ? 'Loading...' : 'View Data'}
                    </button>
                    <button className="btn small" onClick={handleDownloadNonEligibleReport} disabled={nonEligibleStudents.length === 0}>
                      Download CSV
                    </button>
                    <button className="btn small" style={{ marginLeft: "4px" }} disabled={nonEligibleStudents.length === 0} onClick={() => {
                      exportPDF("Non-Eligible Students", ["ID", "Name", "Email", "Contact", "Education", "School"],
                        nonEligibleStudents.map(s => [s.id, s.student_name || "", s.email || "", s.contact || "", s.education || "", s.school || s.college || ""]),
                        "non_eligible_students.pdf");
                    }}>Export PDF</button>
                  </div>
                </div>
                {/* Fee Paid vs Pending Report */}
                <div className="report-card">
                  <h4>Fee Paid vs Pending {filteredFeeSummary ? "(Filtered)" : ""}</h4>
                  <div className="report-meta">
                    {(() => {
                      const data = filteredFeeSummary || feeSummary;
                      return (<>
                        <p>Fully Paid: <strong>{data.filter(f => f.status === "paid").length}</strong></p>
                        <p>Partial: <strong>{data.filter(f => f.status === "partial").length}</strong></p>
                        <p>Pending: <strong>{data.filter(f => f.status === "pending").length}</strong></p>
                      </>);
                    })()}
                  </div>
                  <button className="btn small" onClick={() => {
                    const rows = ["Student,Total Fee,Paid,Balance,Status", ...feeSummary.map(f => `"${f.student_name || f.student_id}",${f.total_fee || 0},${f.total_paid || 0},${f.balance || 0},${f.status}`)];
                    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "fee_paid_vs_pending.csv"; a.click();
                  }}>Download CSV</button>
                  <button className="btn small" style={{ marginLeft: "4px" }} onClick={() => {
                    const data = filteredFeeSummary || feeSummary;
                    exportPDF("Fee Paid vs Pending", ["Student", "Total Fee", "Paid", "Balance", "Status"],
                      data.map(f => [f.student_name || f.student_id, f.total_fee || 0, f.total_paid || 0, f.balance || 0, f.status]),
                      "fee_paid_vs_pending.pdf");
                  }}>Export PDF</button>
                </div>

                {/* Collections vs Requirements */}
                <div className="report-card">
                  <h4>Collections vs Requirements</h4>
                  <div className="report-meta">
                    <p>Total Required: <strong>{"\u20B9"}{feeSummary.reduce((s,f) => s + (f.total_fee || 0), 0).toLocaleString()}</strong></p>
                    <p>Total Collected: <strong>{"\u20B9"}{feePayments.reduce((s,fp) => s + (parseFloat(fp.amount) || 0), 0).toLocaleString()}</strong></p>
                    <p>Gap: <strong>{"\u20B9"}{Math.max(0, feeSummary.reduce((s,f) => s + (f.total_fee || 0), 0) - feePayments.reduce((s,fp) => s + (parseFloat(fp.amount) || 0), 0)).toLocaleString()}</strong></p>
                    <p>Donation Total: <strong>{"\u20B9"}{donorMappings.reduce((s,d) => s + (parseFloat(d.amount) || 0), 0).toLocaleString()}</strong></p>
                  </div>
                  <button className="btn small" onClick={() => {
                    const totalReq = feeSummary.reduce((s,f) => s + (f.total_fee || 0), 0);
                    const totalCol = feePayments.reduce((s,fp) => s + (parseFloat(fp.amount) || 0), 0);
                    const rows = ["Metric,Amount", `Total Required,${totalReq}`, `Total Collected,${totalCol}`, `Gap,${Math.max(0,totalReq-totalCol)}`, `Donations Mapped,${donorMappings.reduce((s,d) => s + (parseFloat(d.amount)||0), 0)}`];
                    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "collections_vs_requirements.csv"; a.click();
                  }}>Download CSV</button>
                  <button className="btn small" style={{ marginLeft: "4px" }} onClick={() => {
                    const totalReq = feeSummary.reduce((s,f) => s + (f.total_fee || 0), 0);
                    const totalCol = feePayments.reduce((s,fp) => s + (parseFloat(fp.amount) || 0), 0);
                    exportPDF("Collections vs Requirements", ["Metric", "Amount"],
                      [["Total Required", totalReq], ["Total Collected", totalCol], ["Gap", Math.max(0, totalReq - totalCol)], ["Donations Mapped", donorMappings.reduce((s,d) => s + (parseFloat(d.amount)||0), 0)]],
                      "collections_vs_requirements.pdf");
                  }}>Export PDF</button>
                </div>

                {/* Student-wise Breakdown */}
                <div className="report-card">
                  <h4>Student-wise Breakdown</h4>
                  <div className="report-meta">
                    <p>Total Students: <strong>{students.length}</strong></p>
                    <p>With Fee Data: <strong>{feeSummary.length}</strong></p>
                    <p>With Donors: <strong>{new Set(donorMappings.map(d => d.student_id)).size}</strong></p>
                  </div>
                  <button className="btn small" onClick={() => {
                    const rows = ["Student ID,Name,Education,Fee Total,Fee Paid,Balance,Status,Donor"];
                    students.forEach(s => {
                      const fee = feeSummary.find(f => f.student_id === s.id) || {};
                      const donor = donorMappings.find(d => d.student_id === s.id);
                      rows.push(`${s.id},"${s.name}","${s.course || ""}",${fee.total_fee || 0},${fee.total_paid || 0},${fee.balance || 0},${fee.status || "N/A"},"${donor ? donor.donor_name : "None"}"`);
                    });
                    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "student_wise_breakdown.csv"; a.click();
                  }}>Download CSV</button>
                  <button className="btn small" style={{ marginLeft: "4px" }} onClick={() => {
                    exportPDF("Student-wise Breakdown", ["ID", "Name", "Education", "Fee Total", "Paid", "Balance", "Status", "Donor"],
                      students.map(s => {
                        const fee = feeSummary.find(f => f.student_id === s.id) || {};
                        const donor = donorMappings.find(d => d.student_id === s.id);
                        return [s.id, s.name, s.course || "", fee.total_fee || 0, fee.total_paid || 0, fee.balance || 0, fee.status || "N/A", donor ? donor.donor_name : "None"];
                      }),
                      "student_wise_breakdown.pdf");
                  }}>Export PDF</button>
                </div>
              </div>

              {/* Eligible Students Table */}
{activeReportList === "eligible" && (
                <div className="table-wrap" style={{marginTop: '24px'}}>
                  <h3>Eligible Students List</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Contact</th>
                        <th>Education</th>
                        {/* <th>Year</th> */}
                        <th>School/College</th>
                        <th>Date Added</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eligibleStudents.map(s => (
                        <tr key={s.id}>
                          <td>{s.student_name || s.full_name}</td>
                          <td>{s.email || s.email}</td>
                          <td>{s.contact || s.contact}</td>
                          <td>{s.education || s.class}</td>
                          {/* <td>{s.year || '-'}</td> */}
                          <td>{s.school || s.college || '-'}</td>
                          <td>
                            {s.created_at 
                              ? new Date(s.created_at).toLocaleDateString() 
                              : '-'
                            }
                          </td>
                          <td>
                            <button 
                              className="btn small" 
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
{activeReportList === "nonEligible" && (
                <div className="table-wrap" style={{marginTop: '24px'}}>
                  <h3>Non-Eligible Students List</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
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
                          <td>{s.student_name || s.full_name}</td>
                          <td>{s.email || s.email}</td>
                          <td>{s.contact || s.contact}</td>
                          <td>{s.education || s.class}</td>
                          <td>{s.school || s.college || '-'}</td>
                         
                          <td>
                            {s.created_at 
                              ? new Date(s.created_at).toLocaleDateString() 
                              : '-'
                            }
                          </td>
                          <td>
                            <button 
                              className="btn small" 
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
                  <h4>Profile Settings</h4>
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
                  <h4>Notification Preferences</h4> 
                  <h4>(Under Construction)</h4>
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

                <div className="settings-card">
                  <h4>System Preferences</h4> 
                  <h4>(Under Construction)</h4>
                  <div className="settings-form">
                    <label>
                      Default Language
                      <select 
                        className="form-input"
                        value={defaultLanguage}
                        onChange={(e) => setDefaultLanguage(e.target.value)}
                      >
                        <option>English</option>
                        <option>Hindi</option>
                      </select>
                    </label>
                    <label>
                      Time Zone
                      <select 
                        className="form-input"
                        value={timeZone}
                        onChange={(e) => setTimeZone(e.target.value)}
                      >
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

        {/* FAMILY & INCOME */}
        <p><strong>Father's Name:</strong> {viewStudent.father_name || "—"}</p>
        <p><strong>Mother's Name:</strong> {viewStudent.mother_name || "—"}</p>
        <p><strong>Guardian's Name:</strong> {viewStudent.guardian_name || "—"}</p>
        <p><strong>Head of Family:</strong> {viewStudent.head_of_family || "—"}</p>
        <p><strong>Income Source:</strong> {viewStudent.income_source || "—"}</p>
        <p><strong>Monthly Income:</strong> {viewStudent.monthly_income ? `₹${viewStudent.monthly_income}` : "—"}</p>
        <p><strong>No. of Dependents:</strong> {viewStudent.num_dependents || "—"}</p>
        <p><strong>School/College Address:</strong> {viewStudent.school_address || "—"}</p>

        {/* CAMP INFO */}
        <p><strong>Camp Name:</strong> {viewStudent.camp}</p>
        <p><strong>Camp Date:</strong> {viewStudent.campDate}</p>

        {/* EDUCATION */}
        <p><strong>Class / Year:</strong> {viewStudent.class}</p>
        {/* <p><strong>Branch / Stream:</strong> {viewStudent.branch}</p> */}
        {/* <p><strong>Course:</strong> {viewStudent.course}</p> */}
        {/* <p><strong>Certificates:</strong> {viewStudent.certificates}</p> */}

        {/* PERCENTAGES */}
        <p><strong>Previous %:</strong> {viewStudent.prev_percent}</p>
        <p><strong>Present %:</strong> {viewStudent.present_percent}</p>

        {/* CONTACT INFO */}
        <p><strong>Email:</strong> {viewStudent.email}</p>
        <p><strong>Contact:</strong> {viewStudent.contact}</p>
        <p><strong>WhatsApp:</strong> {viewStudent.whatsapp}</p>
        <p><strong>Student Contact:</strong> {viewStudent.student_contact}</p>

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
        <p><strong>Donor / Volunteer:</strong> {viewStudent.donor}</p>

        {/* CREATED AT */}
        <p><strong>Record Created:</strong> 
          {viewStudent.created_at ? new Date(viewStudent.created_at).toLocaleString() : "—"}
        </p>

      </div>

      {/* Documents Section */}
      <div style={{ marginTop: "20px" }}>
        <h4>Documents</h4>
        {viewStudentDocs.length > 0 ? (
          <table className="data-table" style={{ fontSize: "0.85em", marginTop: "8px" }}>
            <thead><tr><th>File</th><th>Category</th><th>Uploaded</th><th>Action</th></tr></thead>
            <tbody>
              {viewStudentDocs.map(d => (
                <tr key={d.id}>
                  <td>{d.file_name}</td>
                  <td>{d.category}</td>
                  <td>{d.created_at ? new Date(d.created_at).toLocaleDateString() : "—"}</td>
                  <td>
                    <a href={d.file_url} target="_blank" rel="noopener noreferrer" style={{ color: "#1976d2" }}>Download</a>
                    {" "}
                    <button className="btn small" style={{ color: "#c62828", fontSize: "0.85em" }} onClick={async () => {
                      if (!window.confirm("Delete this document?")) return;
                      try { const axios = (await import("axios")).default; await axios.delete(`/api/documents/${d.id}`); setViewStudentDocs(prev => prev.filter(x => x.id !== d.id)); } catch(e) { alert("Error deleting."); }
                    }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (<p style={{ color: "#888", fontSize: "0.9em" }}>No documents uploaded.</p>)}
        <label style={{ display: "inline-block", marginTop: "8px", cursor: "pointer", color: "#1976d2", fontSize: "0.9em" }}>
          Upload Document
          <input type="file" style={{ display: "none" }} onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || !viewStudent) return;
            try {
              const axios = (await import("axios")).default;
              const formData = new FormData();
              formData.append("file", file);
              formData.append("student_id", viewStudent.id);
              formData.append("uploaded_by", currentUser?.email || "admin");
              formData.append("category", "admin_upload");
              const { data: resp } = await axios.post("/api/documents", formData);
              if (resp?.data) setViewStudentDocs(prev => [resp.data, ...prev]);
              alert("Document uploaded!");
            } catch (err) { alert("Upload failed."); }
          }} />
        </label>
      </div>

      <button
        className="btn primary"
        style={{ marginTop: "20px" }}
        onClick={() => { setViewStudent(null); setViewStudentDocs([]); }}
      >
        Close
      </button>
    </div>
  </div>
)}




      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "80vh", overflowY: "auto" }}>
            <h3>Add New Student</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label>First Name *<input value={addStudentForm.first_name} onChange={(e) => setAddStudentForm(f => ({ ...f, first_name: e.target.value }))} /></label>
              <label>Last Name *<input value={addStudentForm.last_name} onChange={(e) => setAddStudentForm(f => ({ ...f, last_name: e.target.value }))} /></label>
              <label>Email *<input type="email" value={addStudentForm.email} onChange={(e) => setAddStudentForm(f => ({ ...f, email: e.target.value }))} /></label>
              <label>Contact<input value={addStudentForm.contact} onChange={(e) => setAddStudentForm(f => ({ ...f, contact: e.target.value }))} /></label>
              <label>WhatsApp<input value={addStudentForm.whatsapp} onChange={(e) => setAddStudentForm(f => ({ ...f, whatsapp: e.target.value }))} /></label>
              <label>Date of Birth<input type="date" value={addStudentForm.dob} onChange={(e) => setAddStudentForm(f => ({ ...f, dob: e.target.value }))} /></label>
              <label>Age<input type="number" value={addStudentForm.age} onChange={(e) => setAddStudentForm(f => ({ ...f, age: e.target.value }))} /></label>
              <label>School/College<input value={addStudentForm.school} onChange={(e) => setAddStudentForm(f => ({ ...f, school: e.target.value }))} /></label>
              <label>Class/Year<input value={addStudentForm.class} onChange={(e) => setAddStudentForm(f => ({ ...f, class: e.target.value }))} /></label>
              <label>Education Category<input value={addStudentForm.educationcategory} onChange={(e) => setAddStudentForm(f => ({ ...f, educationcategory: e.target.value }))} /></label>
              <label>Branch<input value={addStudentForm.branch} onChange={(e) => setAddStudentForm(f => ({ ...f, branch: e.target.value }))} /></label>
              <label>Address<input value={addStudentForm.address} onChange={(e) => setAddStudentForm(f => ({ ...f, address: e.target.value }))} /></label>
              <label>Camp Name<input value={addStudentForm.camp_name} onChange={(e) => setAddStudentForm(f => ({ ...f, camp_name: e.target.value }))} /></label>
              <label>Fee Structure<input value={addStudentForm.fee_structure} onChange={(e) => setAddStudentForm(f => ({ ...f, fee_structure: e.target.value }))} /></label>
              <label>Prev %<input value={addStudentForm.prev_percent} onChange={(e) => setAddStudentForm(f => ({ ...f, prev_percent: e.target.value }))} /></label>
              <label>Present %<input value={addStudentForm.present_percent} onChange={(e) => setAddStudentForm(f => ({ ...f, present_percent: e.target.value }))} /></label>
              <label>Father's Name<input value={addStudentForm.father_name} onChange={(e) => setAddStudentForm(f => ({ ...f, father_name: e.target.value }))} /></label>
              <label>Mother's Name<input value={addStudentForm.mother_name} onChange={(e) => setAddStudentForm(f => ({ ...f, mother_name: e.target.value }))} /></label>
              <label>Guardian's Name<input value={addStudentForm.guardian_name} onChange={(e) => setAddStudentForm(f => ({ ...f, guardian_name: e.target.value }))} /></label>
              <label>Head of Family<input value={addStudentForm.head_of_family} onChange={(e) => setAddStudentForm(f => ({ ...f, head_of_family: e.target.value }))} /></label>
              <label>Income Source<input value={addStudentForm.income_source} onChange={(e) => setAddStudentForm(f => ({ ...f, income_source: e.target.value }))} /></label>
              <label>Monthly Income<input type="number" value={addStudentForm.monthly_income} onChange={(e) => setAddStudentForm(f => ({ ...f, monthly_income: e.target.value }))} /></label>
              <label>No. of Dependents<input type="number" value={addStudentForm.num_dependents} onChange={(e) => setAddStudentForm(f => ({ ...f, num_dependents: e.target.value }))} /></label>
              <label>School Address<input value={addStudentForm.school_address} onChange={(e) => setAddStudentForm(f => ({ ...f, school_address: e.target.value }))} /></label>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn primary" onClick={handleAddStudent}>Add Student</button>
              <button className="btn" onClick={() => setShowAddStudentModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editStudentModal && (
        <div className="modal-overlay" onClick={() => setEditStudentModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "80vh", overflowY: "auto" }}>
            <h3>Edit Student (ID: {editStudentModal.id})</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <label>First Name<input value={editStudentModal.first_name} onChange={(e) => setEditStudentModal(f => ({ ...f, first_name: e.target.value }))} /></label>
              <label>Last Name<input value={editStudentModal.last_name} onChange={(e) => setEditStudentModal(f => ({ ...f, last_name: e.target.value }))} /></label>
              <label>Email<input type="email" value={editStudentModal.email} onChange={(e) => setEditStudentModal(f => ({ ...f, email: e.target.value }))} /></label>
              <label>Contact<input value={editStudentModal.contact} onChange={(e) => setEditStudentModal(f => ({ ...f, contact: e.target.value }))} /></label>
              <label>School/College<input value={editStudentModal.school} onChange={(e) => setEditStudentModal(f => ({ ...f, school: e.target.value }))} /></label>
              <label>Class/Year<input value={editStudentModal.class} onChange={(e) => setEditStudentModal(f => ({ ...f, class: e.target.value }))} /></label>
              <label>Education Category<input value={editStudentModal.educationcategory} onChange={(e) => setEditStudentModal(f => ({ ...f, educationcategory: e.target.value }))} /></label>
              <label>Fee Structure<input value={editStudentModal.fee_structure} onChange={(e) => setEditStudentModal(f => ({ ...f, fee_structure: e.target.value }))} /></label>
              <label>Address<input value={editStudentModal.address} onChange={(e) => setEditStudentModal(f => ({ ...f, address: e.target.value }))} /></label>
              <label>Father's Name<input value={editStudentModal.father_name || ""} onChange={(e) => setEditStudentModal(f => ({ ...f, father_name: e.target.value }))} /></label>
              <label>Mother's Name<input value={editStudentModal.mother_name || ""} onChange={(e) => setEditStudentModal(f => ({ ...f, mother_name: e.target.value }))} /></label>
              <label>Guardian's Name<input value={editStudentModal.guardian_name || ""} onChange={(e) => setEditStudentModal(f => ({ ...f, guardian_name: e.target.value }))} /></label>
              <label>Head of Family<input value={editStudentModal.head_of_family || ""} onChange={(e) => setEditStudentModal(f => ({ ...f, head_of_family: e.target.value }))} /></label>
              <label>Income Source<input value={editStudentModal.income_source || ""} onChange={(e) => setEditStudentModal(f => ({ ...f, income_source: e.target.value }))} /></label>
              <label>Monthly Income<input type="number" value={editStudentModal.monthly_income || ""} onChange={(e) => setEditStudentModal(f => ({ ...f, monthly_income: e.target.value }))} /></label>
              <label>No. of Dependents<input type="number" value={editStudentModal.num_dependents || ""} onChange={(e) => setEditStudentModal(f => ({ ...f, num_dependents: e.target.value }))} /></label>
              <label>School Address<input value={editStudentModal.school_address || ""} onChange={(e) => setEditStudentModal(f => ({ ...f, school_address: e.target.value }))} /></label>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn primary" onClick={handleEditStudentSave}>Save Changes</button>
              <button className="btn" onClick={() => setEditStudentModal(null)}>Cancel</button>
            </div>
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
            <h3>Quick Broadcast</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const title = fd.get("title");
              const msg = fd.get("msg");
              const rec = fd.get("rec");
              if (!title) { alert("Title is required"); return; }
              try {
                const { data: resp } = await (await import("axios")).default.post(
                  "/api/notifications/broadcast",
                  { recipient_role: rec === "all" ? null : rec, title, message: msg, type: "broadcast", priority: "medium", created_by: currentUser?.email }
                );
                alert(`Broadcast sent to ${resp?.data?.count || 0} recipients!`);
                setBroadcastOpen(false);
                const { data: refreshed } = await supabase.from("notifications").select("*");
                if (refreshed) setAdminNotifications(refreshed);
              } catch (err) { alert("Error: " + err.message); }
            }}>
              <label>Title *<input name="title" placeholder="Notification title" required /></label>
              <label>Message<textarea name="msg" rows={4} placeholder="Message body" /></label>
              <label>Recipients<select name="rec">
                <option value="all">All Users</option>
                <option value="student">All Students</option>
                <option value="donor">All Donors</option>
                <option value="volunteer">All Volunteers</option>
              </select></label>
              <div style={{display:'flex',gap:8,marginTop:12}}>
                <button className="btn primary" type="submit">Send</button>
                <button className="btn" type="button" onClick={() => setBroadcastOpen(false)}>Close</button>
              </div>
            </form>
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
              <p><strong>Date Added:</strong> {
                viewEligibleStudent.created_at 
                  ? new Date(viewEligibleStudent.created_at).toLocaleString()
                  : '-'
              }</p>
              {viewEligibleStudent.student_id && (
                <p><strong>Student ID:</strong> {viewEligibleStudent.student_id}</p>
              )}
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
             
              
              <p><strong>Date Added:</strong> {
                viewNonEligibleStudent.created_at 
                  ? new Date(viewNonEligibleStudent.created_at).toLocaleString()
                  : '-'
              }</p>
              {viewNonEligibleStudent.student_id && (
                <p><strong>Student ID:</strong> {viewNonEligibleStudent.student_id}</p>
              )}
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