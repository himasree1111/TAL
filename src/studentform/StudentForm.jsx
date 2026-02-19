import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../StudentForm.css";
import supabase from "../supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { runFullValidation } from "./helpers/validation";
import { createInputChangeHandler } from "./helpers/handleInputChange";

import VolunteerSection from "./VolunteerSection";
import PersonalDataSection from "./PersonalDataSection";
import AcademicDataSection from "./AcademicDataSection";
import OtherDetailsSection from "./OtherDetailsSection";
import DocumentUploadSection from "./DocumentUploadSection";
import RemarksSection from "./RemarksSection";

export default function StudentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [volunteerEmail, setVolunteerEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [, setUserEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    first_name: "", last_name: "", middle_name: "",
    dob: "", age: "", pob: "", camp_name: "",
    nationality: "", address: "", class: "",
    educationcategory: "", educationsubcategory: "", educationyear: "",
    educationcategory_custom: "", educationsubcategory_custom: "", educationyear_custom: "",
    email: "", contact: "", whatsapp: "", student_contact: "",
    school: "", branch: "", prev_percent: "", present_percent: "",
    fee: "", fee_structure: "", job: "", aspiration: "",
    scholarship: "", certificates: "", years_area: "",
    num_family_members: "", family_members_details: [],
    num_earning_members: "", earning_members_details: [],
    father_name: "", mother_name: "", guardian_name: "",
    head_of_family: "", income_source: "", monthly_income: "",
    num_dependents: "", school_address: "",
    account_no: "", bank_name: "", bank_branch: "", ifsc_code: "",
    special_remarks: "", volunteer_name: "", volunteer_contact: "",
    academic_achievements: "", non_academic_achievements: "",
    is_single_parent: "", does_work: "", has_scholarship: "",
  });

  const [files, setFiles] = useState({
    school_id: null, aadhaar: null, income_proof: null,
    marksheet: null, passport_photo: null, fees_receipt: null,
    volunteer_signature: null, student_signature: null,
  });

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) return;
        if (data?.user) {
          const role = data.user.user_metadata?.user_type || "volunteer";
          setUserRole(role);
          setUserEmail(data.user.email);
          if (role === "volunteer") {
            setVolunteerEmail(data.user.email);
          } else if (role === "student") {
            setFormData((prev) => ({ ...prev, email: data.user.email }));
          }
        }
      } catch (err) { /* silenced */ }
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    const fetchStudent = async () => {
      const { data, error } = await supabase
        .from("student_form_submissions")
        .select("*")
        .eq("id", parseInt(id))
        .single();
      if (error) { toast.error("Error loading student data"); return; }

      let updatedData = { ...data };
      if (data.family_members_details) {
        try {
          updatedData.family_members_details = data.family_members_details || [];
          updatedData.num_family_members = (data.family_members_details || []).length.toString();
          updatedData.earning_members_details = data.earning_members_details || [];
          updatedData.num_earning_members = (data.earning_members_details || []).length.toString();
        } catch (e) {
          updatedData.family_members_details = [];
          updatedData.num_family_members = "0";
        }
      } else {
        updatedData.family_members_details = [];
        updatedData.num_family_members = data.num_family_members || "0";
      }

      if (data.earning_members_details) {
        try {
          updatedData.earning_members_details = data.earning_members_details || [];
          updatedData.num_earning_members = (data.earning_members_details || []).length.toString();
        } catch (e) {
          updatedData.earning_members_details = [];
          updatedData.num_earning_members = "0";
        }
      } else {
        updatedData.earning_members_details = [];
        updatedData.num_earning_members = data.earning_members || "0";
      }
      updatedData.is_single_parent = data.is_single_parent ? "YES" : "NO";
      updatedData.does_work = data.does_work ? "YES" : "NO";
      updatedData.has_scholarship = data.has_scholarship ? "YES" : "NO";

      setFormData((prev) => ({ ...prev, ...updatedData }));
    };
    fetchStudent();
  }, [id, isEditMode]);

  const handleInputChange = createInputChangeHandler(formData, setFormData, setErrors, userRole);

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) setFiles({ ...files, [field]: file });
  };

  const uploadFileToStorage = async (file, folder) => {
    if (!file) return null;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", folder);
    const { data } = await (await import("axios")).default.post("/api/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    return data?.publicUrl ?? null;
  };

  const yesNoToBool = (val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") return val.toUpperCase() === "YES";
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = runFullValidation(formData, userRole);
    setErrors((prev) => ({ ...prev, ...newErrors }));

    if (Object.keys(newErrors).length > 0) {
      const inlineMsg = newErrors._missing ? newErrors._missing : "Please correct the highlighted fields.";
      toast.warn("Please correct the errors before submitting. " + inlineMsg);
      const firstField = Object.keys(newErrors).find((k) => k !== "_missing");
      if (firstField) {
        const el = document.querySelector(`[name="${firstField}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    if (!volunteerEmail && userRole !== "student") {
      toast.warn("Please sign in before submitting.");
      return;
    }

    try {
      const uploadedFiles = {};
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          const url = await uploadFileToStorage(file, key);
          uploadedFiles[key] = url;
        }
      }

      const doesWork = yesNoToBool(formData.does_work);
      const hasScholarship = yesNoToBool(formData.has_scholarship);
      const isSingleParent = yesNoToBool(formData.is_single_parent);

      const payload = {
        volunteer_email: volunteerEmail || null,
        volunteer_name: formData.volunteer_name || null,
        volunteer_contact: formData.volunteer_contact || null,
        submitted_by: userRole || "volunteer",
        first_name: formData.first_name,
        middle_name: formData.middle_name || null,
        last_name: formData.last_name,
        dob: formData.dob || null,
        age: parseInt(formData.age),
        pob: formData.pob || null,
        camp_name: formData.camp_name || null,
        camp_date: formData.camp_date || null,
        nationality: formData.nationality || null,
        address: formData.address,
        class: formData.class,
        educationcategory: formData.educationcategory === "Other" ? formData.educationcategory_custom : formData.educationcategory || null,
        educationsubcategory: formData.educationsubcategory === "Other" ? formData.educationsubcategory_custom : formData.educationsubcategory || null,
        educationyear: formData.educationyear === "Other" ? formData.educationyear_custom : formData.educationyear || null,
        school: formData.school,
        branch: formData.branch || null,
        prev_percent: parseFloat(formData.prev_percent) || null,
        present_percent: parseFloat(formData.present_percent) || null,
        email: formData.email,
        contact: formData.contact,
        whatsapp: formData.whatsapp,
        student_contact: formData.student_contact || null,
        num_family_members: parseInt(formData.num_family_members) || 0,
        family_members_details: formData.family_members_details,
        earning_members: parseInt(formData.num_earning_members) || 0,
        earning_members_details: formData.earning_members_details,
        fee: formData.fee || null,
        fee_structure: formData.fee_structure,
        is_single_parent: isSingleParent,
        does_work: doesWork,
        job: doesWork ? formData.job : null,
        has_scholarship: hasScholarship,
        scholarship: hasScholarship ? formData.scholarship : null,
        father_name: formData.father_name || null,
        mother_name: formData.mother_name || null,
        guardian_name: formData.guardian_name || null,
        head_of_family: formData.head_of_family || null,
        income_source: formData.income_source || null,
        monthly_income: parseFloat(formData.monthly_income) || null,
        num_dependents: parseInt(formData.num_dependents) || null,
        school_address: formData.school_address || null,
        aspiration: formData.aspiration || null,
        academic_achievements: formData.academic_achievements || null,
        non_academic_achievements: formData.non_academic_achievements || null,
        years_area: formData.years_area || null,
        account_no: formData.account_no || null,
        bank_name: formData.bank_name || null,
        bank_branch: formData.bank_branch || null,
        ifsc_code: formData.ifsc_code || null,
        special_remarks: formData.special_remarks || null,
        school_id_url: uploadedFiles.school_id || null,
        aadhaar_url: uploadedFiles.aadhaar || null,
        income_proof_url: uploadedFiles.income_proof || null,
        marksheet_url: uploadedFiles.marksheet || null,
        passport_photo_url: uploadedFiles.passport_photo || null,
        fees_receipt_url: uploadedFiles.fees_receipt || null,
        volunteer_signature_url: uploadedFiles.volunteer_signature || null,
        student_signature_url: uploadedFiles.student_signature || null,
      };

      let result;
      if (isEditMode && id) {
        result = await supabase.from("student_form_submissions").update(payload).eq("id", parseInt(id));
      } else {
        result = await supabase.from("student_form_submissions").insert([payload]);
      }

      if (result.error) {
        toast.error("Error saving student: " + result.error.message);
        return;
      }

      toast.success("Form submitted successfully!");
      setSuccessMessage("Form submitted successfully!");
      navigate(userRole === "student" ? "/student-dashboard" : "/volunteer-dashboard");

      setFormData({
        first_name: "", last_name: "", middle_name: "",
        dob: "", age: "", pob: "", camp_name: "",
        nationality: "", address: "", class: "",
        educationcategory: "", educationsubcategory: "", educationyear: "",
        email: "", contact: "", whatsapp: "", student_contact: "",
        school: "", branch: "", prev_percent: "", present_percent: "",
        fee: "", fee_structure: "", job: "", aspiration: "",
        scholarship: "", certificates: "", years_area: "",
        num_family_members: "", family_members_details: [],
        num_earning_members: "", earning_members_details: [],
        account_no: "", bank_name: "", bank_branch: "", ifsc_code: "",
        special_remarks: "", is_single_parent: "", does_work: "", has_scholarship: "",
      });
      setFiles({
        school_id: null, aadhaar: null, income_proof: null,
        marksheet: null, passport_photo: null, fees_receipt: null,
        volunteer_signature: null, student_signature: null,
      });
      setErrors({});
    } catch (err) {
      toast.error("Unexpected error occurred");
    }
  };

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      <button className="back-btn" onClick={() => navigate(userRole === "student" ? "/student-dashboard" : "/volunteer-dashboard")}>
        {userRole === "student" ? "Back to Dashboard" : "Back to Volunteer Dashboard"}
      </button>

      <div className="form-container">
        <h1 className="form-title">STUDENT APPLICATION FORM</h1>

        {successMessage && (
          <div className="success-message" style={{ color: "green", marginBottom: "1rem", fontWeight: "bold" }}>
            {successMessage}
          </div>
        )}

        <VolunteerSection formData={formData} handleInputChange={handleInputChange} errors={errors} userRole={userRole} />

        <form onSubmit={handleSubmit}>
          <PersonalDataSection formData={formData} handleInputChange={handleInputChange} errors={errors} />
          <AcademicDataSection formData={formData} handleInputChange={handleInputChange} errors={errors} />
          <OtherDetailsSection formData={formData} handleInputChange={handleInputChange} errors={errors} />
          <DocumentUploadSection formData={formData} handleInputChange={handleInputChange} errors={errors} files={files} handleFileChange={handleFileChange} />
          <RemarksSection formData={formData} handleInputChange={handleInputChange} />

          <div className="submit-container">
            <button type="submit">{isEditMode ? "Save" : "Submit Application"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
