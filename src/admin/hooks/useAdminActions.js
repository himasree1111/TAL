import { useNavigate } from "react-router-dom";
import supabase from "../../supabaseClient";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function useAdminActions(data) {
  const navigate = useNavigate();
  const {
    students, setStudents,
    donors, setDonors,
    setDonorMappings,
    setFeePayments,
    feeSummary, setFeeSummary,
    setAdminNotifications,
    currentUser, setCurrentUser,
    eligibleStudents,
    nonEligibleStudents,
    newDonorForm, setNewDonorForm,
    newPaymentForm, setNewPaymentForm,
    addStudentForm, setAddStudentForm,
    setShowAddStudentModal,
    setEditStudentModal,
    editStudentModal,
    setEditStudent,
    broadcastTitle, setBroadcastTitle,
    broadcastMessage, setBroadcastMessage,
    broadcastRecipient,
    reportStartDate, reportEndDate,
    setFilteredFeeSummary, setFilteredDonationSummary,
    adminName, contactNumber,
    emailNotifications, smsAlerts, systemNotifications,
    defaultLanguage, timeZone,
    transformStudents,
    processDonorData,
  } = data;

  const handleDownloadEligibleReport = () => {
    if (eligibleStudents.length === 0) {
      toast.warn("No eligible students to export");
      return;
    }
    const rows = [
      "id,student_name,email,contact,education,year,school,college,created_at",
      ...eligibleStudents.map((s) =>
        `${s.id},"${s.student_name || ""}","${s.email || ""}","${s.contact || ""}","${s.education || ""}","${s.year || ""}","${s.school || ""}","${s.college || ""}","${s.created_at || ""}"`
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eligible-students-report.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded successfully!");
  };

  const handleDownloadNonEligibleReport = () => {
    if (nonEligibleStudents.length === 0) {
      toast.warn("No non-eligible students to export");
      return;
    }
    const rows = [
      "id,student_name,email,contact,education,year,school,college,created_at",
      ...nonEligibleStudents.map((s) =>
        `${s.id},"${s.student_name || ""}","${s.email || ""}","${s.contact || ""}","${s.education || ""}","${s.year || ""}","${s.school || ""}","${s.college || ""}","${s.created_at || ""}"`
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "non-eligible-students-report.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded successfully!");
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm("Delete this student record? This cannot be undone.")) return;
    const { error } = await supabase.from("student_form_submissions").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed: " + error.message);
      return;
    }
    setStudents((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddStudent = async () => {
    const f = addStudentForm;
    if (!f.first_name || !f.last_name || !f.email) {
      toast.warn("First name, last name, and email are required.");
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
    const { error } = await supabase.from("student_form_submissions").insert([payload]);
    if (error) {
      toast.error("Error adding student: " + error.message);
      return;
    }
    toast.success("Student added successfully!");
    setShowAddStudentModal(false);
    setAddStudentForm({
      first_name: "", last_name: "", email: "", contact: "", whatsapp: "",
      dob: "", age: "", school: "", class: "", educationcategory: "",
      branch: "", address: "", camp_name: "", fee_structure: "",
      prev_percent: "", present_percent: "", father_name: "", mother_name: "",
      guardian_name: "", head_of_family: "", income_source: "", monthly_income: "",
      num_dependents: "", school_address: "",
    });
    const { data: refreshed } = await supabase.from("admin_student_info").select("*").order("created_at", { ascending: false });
    if (refreshed) setStudents(transformStudents(refreshed));
  };

  const handleEditStudentSave = async () => {
    if (!editStudentModal) return;
    const { id, ...fields } = editStudentModal;
    const payload = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined && val !== "") payload[key] = val;
    }
    const { error } = await supabase.from("student_form_submissions").update(payload).eq("id", id);
    if (error) {
      toast.error("Error updating student: " + error.message);
      return;
    }
    setStudents((prev) =>
      prev.map((s) => {
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
      })
    );
    setEditStudentModal(null);
    toast.success("Student updated successfully!");
  };

  const handleApprove = async (id) => {
    const { error } = await supabase.from("admin_student_info").update({ status: "Eligible" }).eq("id", id);
    if (error) {
      toast.error("Approval failed");
      return;
    }
    setStudents((prev) => prev.filter((s) => s.id !== id));
    toast.success("Student approved");
  };

  const handleNotApprove = async (id) => {
    const { error } = await supabase.from("admin_student_info").update({ status: "Not Eligible" }).eq("id", id);
    if (error) {
      toast.error("Rejection failed");
      return;
    }
    setStudents((prev) => prev.filter((s) => s.id !== id));
    toast.warn("Student rejected");
  };

  const handleEditSave = (editData) => {
    setStudents((prev) => prev.map((p) => (p.id === editData.id ? { ...p, ...editData } : p)));
    setEditStudent(null);
  };

  const exportCSV = () => {
    const rows = [
      "id,name,college,year,donor,feeStatus,course,campName,campDate,paidDate",
      ...students.map((s) => `${s.id},"${s.name}","${s.college}",${s.year},${s.donor},${s.feeStatus},${s.course || ""},"${s.campName || ""}",${s.campDate || ""},${s.paidDate || ""}`),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddDonor = async () => {
    if (!newDonorForm.student_id || !newDonorForm.donor_name) {
      toast.warn("Student ID and Donor Name are required");
      return;
    }
    try {
      const { error } = await supabase.from("donor_mapping").insert({
        student_id: parseInt(newDonorForm.student_id),
        donor_name: newDonorForm.donor_name,
        donor_email: newDonorForm.donor_email || null,
        year_of_support: newDonorForm.year_of_support || null,
        amount: parseFloat(newDonorForm.amount) || 0,
      });
      if (error) { toast.error("Error: " + error.message); return; }
      const { data: refreshed } = await supabase.from("donor_mapping").select("*");
      if (refreshed) {
        setDonorMappings(refreshed);
        setDonors(processDonorData(refreshed));
      }
      setNewDonorForm({ student_id: "", donor_name: "", donor_email: "", year_of_support: "", amount: "" });
      toast.success("Donor mapping added successfully!");
    } catch (err) {
      toast.error("Error adding donor: " + err.message);
    }
  };

  const handleDeleteDonorMapping = async (id) => {
    if (!window.confirm("Remove this donor mapping?")) return;
    try {
      await supabase.from("donor_mapping").delete().eq("id", id);
      setDonorMappings((prev) => prev.filter((dm) => dm.id !== id));
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  const handleExportDonorReport = () => {
    const rows = ["id,name,amount,years", ...donors.map((d) => `${d.id},${d.name},${d.amount},${d.years}`)];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "donors.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleContactDonor = (donor) => {
    const email = window.prompt("Enter email to contact " + donor.name, "donor@example.org");
    if (!email) return;
    window.location.href = `mailto:${email}?subject=Regarding%20support`;
  };

  const handleDownloadFeeReport = () => {
    if (feeSummary.length === 0) { toast.warn("No fee data to export"); return; }
    const rows = [
      "student_id,student_name,total_fee,total_paid,balance,status",
      ...feeSummary.map((s) => `${s.student_id},"${s.student_name}",${s.total_fee},${s.total_paid},${s.balance},${s.status}`),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fee-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRecordPayment = async () => {
    if (!newPaymentForm.student_id || !newPaymentForm.amount || !newPaymentForm.payment_date) {
      toast.warn("Student ID, Amount, and Date are required");
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
      if (error) { toast.error("Error: " + error.message); return; }
      const { data: refreshedFees } = await supabase.from("fee_payments").select("*");
      if (refreshedFees) setFeePayments(refreshedFees);
      try {
        const { data: summaryResp } = await (await import("axios")).default.get("/api/fee-payments/summary");
        if (summaryResp?.data) setFeeSummary(summaryResp.data);
      } catch (e) { /* silenced */ }
      setNewPaymentForm({ student_id: "", amount: "", payment_date: "", payment_method: "cash", notes: "" });
      toast.success("Payment recorded successfully!");
    } catch (err) {
      toast.error("Error recording payment: " + err.message);
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm("Delete this payment record?")) return;
    try {
      await supabase.from("fee_payments").delete().eq("id", id);
      setFeePayments((prev) => prev.filter((fp) => fp.id !== id));
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTitle) { toast.warn("Title is required"); return; }
    try {
      const { data: resp } = await (await import("axios")).default.post("/api/notifications/broadcast", {
        recipient_role: broadcastRecipient === "all" ? null : broadcastRecipient,
        title: broadcastTitle,
        message: broadcastMessage,
        type: "broadcast",
        priority: "medium",
        created_by: currentUser?.email,
      });
      if (resp?.error) { toast.error("Error: " + resp.error.message); return; }
      toast.success(`Broadcast sent to ${resp?.data?.count || 0} recipients!`);
      setBroadcastTitle("");
      setBroadcastMessage("");
      const { data: refreshed } = await supabase.from("notifications").select("*");
      if (refreshed) setAdminNotifications(refreshed);
    } catch (err) {
      toast.error("Error sending broadcast: " + err.message);
    }
  };

  const handleDeleteNotification = async (id) => {
    if (!window.confirm("Delete this notification?")) return;
    try {
      await supabase.from("notifications").delete().eq("id", id);
      setAdminNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportStartDate && !reportEndDate) {
      setFilteredFeeSummary(null);
      setFilteredDonationSummary(null);
      toast.info("Set a date range to filter reports, or reports show all-time data.");
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
      toast.success("Reports filtered for date range: " + (reportStartDate || "start") + " to " + (reportEndDate || "end"));
    } catch (err) {
      toast.error("Error filtering reports.");
    }
  };

  const handleDownloadSpecificReport = (key) => {
    const blob = new Blob([key + " report (demo)"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
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
              time_zone: timeZone,
            },
          },
        });
        if (error) {
          toast.error("Error saving settings: " + error.message);
          return;
        }
        const updatedUser = {
          ...currentUser,
          user_metadata: { ...currentUser.user_metadata, name: adminName },
        };
        setCurrentUser(updatedUser);
        toast.success("Settings saved successfully!");
      }
    } catch (error) {
      toast.error("Error saving settings: " + error.message);
    }
  };

  const openEditModal = (s) => {
    setEditStudent({ ...s });
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) { /* silenced */ }
  };

  return {
    handleDownloadEligibleReport,
    handleDownloadNonEligibleReport,
    handleDeleteStudent,
    handleAddStudent,
    handleEditStudentSave,
    handleApprove,
    handleNotApprove,
    handleEditSave,
    exportCSV,
    handleAddDonor,
    handleDeleteDonorMapping,
    handleExportDonorReport,
    handleContactDonor,
    handleDownloadFeeReport,
    handleRecordPayment,
    handleDeletePayment,
    handleSendBroadcast,
    handleDeleteNotification,
    handleGenerateReport,
    handleDownloadSpecificReport,
    exportPDF,
    handleSaveSettings,
    openEditModal,
    handleLogout,
  };
}
