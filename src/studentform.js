// src/StudentForm.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentForm.css";
import supabase from "./supabaseClient";
import EducationDropdown from "./EducationDropdown";
import { useParams } from "react-router-dom";

/*
  NOTE: This file preserves your UI exactly and only adds Supabase integration:
  - Uploads files to storage bucket: "student_documents"
  - Inserts a record into table: "student_details"
  - Attaches volunteer's logged-in email as volunteer_email
*/


export default function StudentForm() {
  const navigate = useNavigate();
  const { id } = useParams();   // student id
const isEditMode = !!id;
  const [volunteerEmail, setVolunteerEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({}); // <-- validation errors

  useEffect(() => {
    // fetch logged-in user email (volunteer)
    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.warn("supabase.auth.getUser error:", error);
          return;
        }
        if (data?.user) {
          setVolunteerEmail(data.user.email);
          // REMOVE this line — no user_id in your table
          // setFormData(prevData => ({ ...prevData, user_id: data.user.id }));
        }
      } catch (err) {
        console.error("getUser error:", err);
      }
    };
    getUser();

    // Check if there's edit data in localStorage
    // const editData = localStorage.getItem("editFormData");
    // if (editData) {
    //   try {
    //     const parsedData = JSON.parse(editData);
    //     // Populate form with edit data
    //     setFormData({
    //       first_name: parsedData.first_name || "",
    //       last_name: parsedData.last_name || "",
    //       middle_name: parsedData.middle_name || "",
    //       dob: parsedData.dob || "",
    //       age: parsedData.age || "",
    //       pob: parsedData.pob || "",
    //       camp_name: parsedData.camp_name || "",
    //       nationality: parsedData.nationality || "",
    //       address: parsedData.address || "",
    //       class: parsedData.class || "",
    //       educationcategory: parsedData.educationcategory || "",
    //       educationsubcategory: parsedData.educationsubcategory || "",
    //       educationyear: parsedData.educationyear || "",
    //       fee_structure: parsedData.fee_structure || "",
    //       email: parsedData.email || "",
    //       contact: parsedData.contact || "",
    //       whatsapp: parsedData.whatsapp || "",
    //       student_contact: parsedData.student_contact || "",
    //       school: parsedData.school || "",
    //       branch: parsedData.branch || "",
    //       prev_percent: parsedData.prev_percent || "",
    //       present_percent: parsedData.present_percent || "",
    //       fee: parsedData.fee || "",
    //       job: parsedData.job || "",
    //       aspiration: parsedData.aspiration || "",
    //       scholarship: parsedData.scholarship || "",
    //       certificates: parsedData.certificates || "",
    //       years_area: parsedData.years_area || "",
    //       parents_full_names: parsedData.parents_full_names || "",
    //       family_members: parsedData.family_members || "",
    //       earning_members: parsedData.earning_members || "",
    //       account_no: parsedData.account_no || "",
    //       bank_name: parsedData.bank_name || "",
    //       bank_branch: parsedData.bank_branch || "",
    //       ifsc_code: parsedData.ifsc_code || "",
    //       special_remarks: parsedData.special_remarks || "",
    //       does_work: parsedData.does_work || "",
    //       has_scholarship: parsedData.has_scholarship || ""
    //     });
    //     // Clear the edit data after loading
    //     localStorage.removeItem("editFormData");
    //   } catch (error) {
    //     console.error("Error loading edit data:", error);
    //   }
    // }
  }, []);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    dob: "",
    age: "",
    pob: "",
    camp_name: "",
    nationality: "",
    address: "",
    class: "",
    educationcategory: "",
    educationsubcategory: "",
    educationyear: "",
    email: "",
    contact: "",
    whatsapp: "",
    student_contact: "",
    school: "",
    branch: "",
    prev_percent: "",
    present_percent: "",
    fee: "",
    fee_structure: "",
    job: "",
    aspiration: "",
    scholarship: "",
    certificates: "",
    years_area: "",
    parents_full_names: "",
    family_members: "",
    earning_members: "",
    account_no: "",
    bank_name: "",
    bank_branch: "",
    ifsc_code: "",
    special_remarks: ""
  });

  const [files, setFiles] = useState({
    school_id: null,
    aadhaar: null,
    income_proof: null,
    marksheet: null,
    passport_photo: null,
    fees_receipt: null,
    volunteer_signature: null,
    student_signature: null,
  });



  // Helper: validate a single field and return error message (or empty string)
  const validateField = (name, value) => {
    // Name fields: only alphabets and spaces allowed
    if (name === "first_name" || name === "last_name" || name === "middle_name") {
      if (!value) return `${name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} is required`;
      if (!/^[a-zA-Z\s]+$/.test(value)) {
        return "Only alphabets and spaces are allowed";
      }
      return "";
    }

    // Phone fields (exactly 10 digits)
    if (name === "contact" || name === "whatsapp") {
      if (!value || !/^\d{10}$/.test(value)) {
        return "Must be exactly 10 digits";
      }
      return "";
    }

    // Student number (optional, but if present must be 10 digits)
    if (name === "student_contact") {
      if (!value) return "";
      if (!/^\d{10}$/.test(value)) return "Must be exactly 10 digits (if entered)";
      return "";
    }

    // Account number: digits only, 10-18 digits
    if (name === "account_no") {
      if (!value || !/^\d{10,18}$/.test(value)) {
        return "Account number must be 10 to 18 digits";
      }
      return "";
    }

    // IFSC: 4 letters + 0 + 6 numbers (common pattern)
    // We'll enforce uppercase letters automatically in handleInputChange
    if (name === "ifsc_code") {
      if (!value || !/^[A-Z]{4}0[0-9]{6}$/.test(value)) {
        return "Enter a valid IFSC code (e.g. ABCD0123456)";
      }
      return "";
    }

    // Email proper validation
    if (name === "email") {
      if (!value) return "Email is required";
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(value)) return "Enter a valid email address";
      return "";
    }

    // Age check (already handled at submit) - but live ensure age >= 6 if present
    if (name === "age") {
      if (value !== "" && (Number.isNaN(Number(value)) || Number(value) < 6)) {
        return "Age must be at least 6";
      }
      return "";
    }

    return "";
  };

  // handleInputChange: extended to enforce digit-only and other live rules for specific fields
  const handleInputChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    // PHONE FIELDS: block non-digits and limit to 10
    if (["contact", "whatsapp", "student_contact"].includes(name)) {
      // remove non-digits
      value = value.replace(/\D/g, "");
      // limit length to 10 digits
      if (value.length > 10) value = value.slice(0, 10);
    }

    // ACCOUNT NUMBER: digits only, limit to 18
    if (name === "account_no") {
      value = value.replace(/\D/g, "");
      if (value.length > 18) value = value.slice(0, 18);
    }

    // IFSC: auto uppercase, allow letters/digits, limit to 11 (standard length)
    if (name === "ifsc_code") {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (value.length > 11) value = value.slice(0, 11);
    }

    // DOB handling (existing logic preserved)
    if (name === "dob") {
      let computedAge = "";
      if (value) {
        const dobDate = new Date(value);
        const today = new Date();
        let ageYears = today.getFullYear() - dobDate.getFullYear();
        const m = today.getMonth() - dobDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
          ageYears--;
        }
        computedAge = ageYears >= 0 ? String(ageYears) : "";
      }
      setFormData(prev => ({ ...prev, dob: value, age: computedAge }));
      // validate dob/age live
      setErrors(prev => ({ ...prev, age: validateField("age", computedAge) }));
      return;
    }

    // Education category/subcategory/year handling
    if (name === "educationcategory") {
      setFormData(prev => ({ ...prev, educationcategory: value, educationsubcategory: "", educationyear: "" }));
      return;
    }

    if (name === "educationsubcategory") {
      setFormData(prev => ({ ...prev, educationsubcategory: value, educationyear: "" }));
      return;
    }

    if (name === "educationyear") {
      const subcategoryPart = formData.educationsubcategory ? ` - ${formData.educationsubcategory}` : "";
      const combinedClass = value ? `${formData.educationcategory}${subcategoryPart} - ${value}` : "";
      setFormData(prev => ({ ...prev, educationyear: value, class: combinedClass }));
      return;
    }

    // Update formData
    setFormData(prev => ({ ...prev, [name]: value }));

    // Live-validate this field and update errors
    const fieldError = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: fieldError }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, [field]: file });
    }
  };

  // Upload single file to Supabase storage bucket "student_documents"
  const uploadFileToStorage = async (file, folder) => {
    if (!file) return null;
    const fileName = `${Date.now()}_${file.name}`.replace(/\s+/g, "_");
    const filePath = `${folder}/${fileName}`;

    // Upload
    const { error: uploadError } = await supabase.storage
      .from("student_documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw uploadError;
    }

    // Get public URL (if your bucket is public). If private bucket, you'll need signed URLs.
    const { data: publicData } = supabase.storage
      .from("student_documents")
      .getPublicUrl(filePath);

    return publicData?.publicUrl ?? null;
  };

  // Full form validation (runs on submit)
  const runFullValidation = () => {
    const newErrors = {};

    // Required basics (original list)
    const mandatoryFields = [
      { key: 'age', label: 'Age' },
      { key: 'address', label: 'Address' },
      { key: 'whatsapp', label: 'Whatsapp Number' },
      { key: 'school', label: 'Name of School/College' },
      { key: 'class', label: 'Class' },
      { key: 'prev_percent', label: 'Previous Year Percentage' },
      { key: 'present_percent', label: 'Present Year Percentage' },
      { key: 'fee_structure', label: 'Fee Structure' },
      { key: 'parents_full_names', label: 'Parents Full Names' },
      { key: 'earning_members', label: 'Earning Members' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'contact', label: 'Parent Number' }
    ];

    const missing = mandatoryFields.filter(f => {
      const v = (formData[f.key] || '').toString().trim();
      return v === '';
    });

    if (missing.length > 0) {
      newErrors._missing = 'Please fill in all mandatory fields: ' + missing.map(m => m.label).join(', ');
    }

    // Age check (existing)
    const ageVal = formData.age !== "" && formData.age !== null ? Number(formData.age) : null;
    if (ageVal === null || Number.isNaN(ageVal) || ageVal < 6) {
      newErrors.age = "Age must be at least 6 years";
    }

    // Phone validations
    const contactErr = validateField("contact", formData.contact);
    if (contactErr) newErrors.contact = contactErr;

    const whatsappErr = validateField("whatsapp", formData.whatsapp);
    if (whatsappErr) newErrors.whatsapp = whatsappErr;

    const studentErr = validateField("student_contact", formData.student_contact);
    if (studentErr) newErrors.student_contact = studentErr;

    // Account number
    const accErr = validateField("account_no", formData.account_no);
    if (accErr) newErrors.account_no = accErr;

    // IFSC
    const ifscErr = validateField("ifsc_code", (formData.ifsc_code || "").toUpperCase());
    if (ifscErr) newErrors.ifsc_code = ifscErr;

    // Email
    const emailErr = validateField("email", formData.email);
    if (emailErr) newErrors.email = emailErr;

    return newErrors;
  };
useEffect(() => {
  if (!isEditMode) return;

  const fetchStudent = async () => {
    const { data, error } = await supabase
      .from("student_form_submissions")
      .select("*")
      .eq("id", parseInt(id))
      .single();

    if (error) {
      alert("Error loading student data");
      return;
    }

    setFormData(prev => ({
  ...prev,
  ...data
}));

  };

  fetchStudent();
}, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // run current full validation
    const newErrors = runFullValidation();
    setErrors(prev => ({ ...prev, ...newErrors }));

    // if any errors present, alert and block submission
    if (Object.keys(newErrors).length > 0) {
      // popup alert summarizing
      const inlineMsg = newErrors._missing ? newErrors._missing : "Please correct the highlighted fields.";
      alert("Please correct the errors before submitting.\n\n" + inlineMsg);
      // scroll to first error field if possible
      const firstField = Object.keys(newErrors).find(k => k !== "_missing");
      if (firstField) {
        const el = document.querySelector(`[name="${firstField}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Ensure volunteer is logged in (we attach email)
    if (!volunteerEmail) {
      alert("⚠️ Volunteer not logged in — student will still be saved locally if needed. Please sign in.");
      // but proceed to save? We'll stop to avoid orphan records.
      return;
    }

    try {
      // Upload files to Supabase storage and get URLs
      const uploadedFiles = {};
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          const url = await uploadFileToStorage(file, key);
          uploadedFiles[key] = url;
        }
      }

      // Prepare payload for Supabase. Map form fields to table columns.
      const payload = {
        volunteer_email: volunteerEmail,
        first_name: formData.first_name,
        middle_name: formData.middle_name || null,
        last_name: formData.last_name,
        dob: formData.dob || null,
        age: parseInt(formData.age),
        pob: formData.pob || null,
        camp_name: formData.camp_name || null,
        nationality: formData.nationality || null,
        address: formData.address,
        class: formData.class,
        educationcategory: formData.educationcategory || null,
        educationsubcategory: formData.educationsubcategory || null,
        educationyear: formData.educationyear || null,
        email: formData.email,
        contact: formData.contact,
        whatsapp: formData.whatsapp,
        student_contact: formData.student_contact || null,
        school: formData.school,
        branch: formData.branch || null,
        prev_percent: parseFloat(formData.prev_percent) || null,
        present_percent: parseFloat(formData.present_percent) || null,
        fee: formData.fee || null,
        fee_structure: formData.fee_structure,
        job: formData.job || null,
        aspiration: formData.aspiration || null,
        scholarship: formData.scholarship || null,
        certificates: formData.certificates || null,
        years_area: formData.years_area || null,
        parents_full_names: formData.parents_full_names,
        family_members: formData.family_members,
        earning_members: formData.earning_members,
        account_no: formData.account_no || null,
        bank_name: formData.bank_name || null,
        bank_branch: formData.bank_branch || null,
        ifsc_code: formData.ifsc_code || null,
        special_remarks: formData.special_remarks || null,
        does_work: formData.does_work || null,
        has_scholarship: formData.has_scholarship || null,
        // File URLs
        school_id_url: uploadedFiles.school_id || null,
        aadhaar_url: uploadedFiles.aadhaar || null,
        income_proof_url: uploadedFiles.income_proof || null,
        marksheet_url: uploadedFiles.marksheet || null,
        passport_photo_url: uploadedFiles.passport_photo || null,
        fees_receipt_url: uploadedFiles.fees_receipt || null,
        volunteer_signature_url: uploadedFiles.volunteer_signature || null,
        student_signature_url: uploadedFiles.student_signature || null,
      };

      // Insert into Supabase
      let result;

if (isEditMode && id) {
  // ✅ UPDATE existing record
  result = await supabase
    .from("student_form_submissions")
    .update(payload)
    .eq("id", parseInt(id));
} else {
  // ✅ INSERT new record
  result = await supabase
    .from("student_form_submissions")
    .insert([payload]);
}

if (result.error) {
  console.error("Supabase save error:", result.error);
  alert("❌ Error saving student: " + result.error.message);
  return;
}



      // if (error) {
      //   console.error("Supabase insert error:", error);
      //   alert("❌ Error saving student: " + error.message);
      //   return;
      // }

      // Success
      alert("🎉 Form submitted successfully!");
      setSuccessMessage("Form submitted successfully!");
      // Navigate back to dashboard and force refresh to show new form
      navigate('/volunteer-dashboard');


      // optionally reset form
      setFormData({
        first_name: "",
        last_name: "",
        middle_name: "",
        dob: "",
        age: "",
        pob: "",
        camp_name: "",
        nationality: "",
        address: "",
        class: "",
        educationcategory: "",
        educationsubcategory: "",
        educationyear: "",
        email: "",
        contact: "",
        whatsapp: "",
        student_contact: "",
        school: "",
        branch: "",
        prev_percent: "",
        present_percent: "",
        fee: "",
        fee_structure: "",
        job: "",
        aspiration: "",
        scholarship: "",
        certificates: "",
        years_area: "",
        parents_full_names: "",
        family_members: "",
        earning_members: "",
        account_no: "",
        bank_name: "",
        bank_branch: "",
        ifsc_code: "",
        special_remarks: ""
      });
      setFiles({
        school_id: null,
        aadhaar: null,
        income_proof: null,
        marksheet: null,
        passport_photo: null,
        fees_receipt: null,
        volunteer_signature: null,
        student_signature: null,
      });
      setErrors({});
    } catch (err) {
      console.error("Unexpected error on submit:", err);
      alert("❌ Unexpected error occurred. Check console.");
    }
  };

  const renderUploadField = (label, field) => (
    <div className="upload-field">
      <span className="label">{label}</span>
      <div className="upload-controls">
        <label className="upload-btn">
          <span className="plus-icon">+</span>
          <input type="file" style={{ display: "none" }} onChange={(e) => handleFileChange(e, field)} />
        </label>
        {files[field] && (
          <span className="file-info">
            <span className="tick">✓</span> {files[field].name}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <button className="back-btn" onClick={() => navigate('/volunteer-dashboard')}>Back to Volunteer Dashboard</button>
       
      <div className="form-container">
        <h1 className="form-title">STUDENT APPLICATION FORM</h1>

      {successMessage && (
        <div className="success-message" style={{ color: "green", marginBottom: "1rem", fontWeight: "bold" }}>
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Personal Data */}
        <div className="section">
          <h2>1. Personal Data</h2>
          <div className="form-group">
            <label>
              <span className="field-label">First Name<span className="required">*</span></span>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleInputChange}
                className={errors.first_name ? "input-error" : ""}
                required
              />
              {errors.first_name && <p className="error-text">{errors.first_name}</p>}
            </label>
            <label>
              Middle Name
              <input
                type="text"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleInputChange}
                className={errors.middle_name ? "input-error" : ""}
              />
              {errors.middle_name && <p className="error-text">{errors.middle_name}</p>}
            </label>
            <label>
              <span className="field-label">Last Name<span className="required">*</span></span>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                className={errors.last_name ? "input-error" : ""}
                required
              />
              {errors.last_name && <p className="error-text">{errors.last_name}</p>}
            </label>
          </div>

          <div className="form-group">
            <label>
              Date of Birth
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleInputChange}
                min="1980-01-01"
                max="2024-12-31"
                required
              />
            </label>
            <label>
              <span className="field-label">Age<span className="required">*</span></span>
              <input type="number" name="age" value={formData.age} min={6} readOnly className="readonly-age" onChange={handleInputChange} />
              {errors.age && <p className="error-text">{errors.age}</p>}
            </label>
            <label>
              Name of Camp
              <input type="text" name="pob" value={formData.pob} onChange={handleInputChange} />
            </label>
            <label>
              Date of Camp
              <input type="date" name="camp_name" value={formData.camp_name} onChange={handleInputChange} />
            </label>
            <label>
              <span className="field-label">Address<span className="required">*</span></span>
              <input type="text" name="address" value={formData.address} onChange={handleInputChange} required />
            </label>
          </div>

          <div className="form-group">
            <label>
              <span className="field-label">Parent Number<span className="required">*</span></span>
              <input
                type="text"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                maxLength={10}
                className={errors.contact ? "input-error" : ""}
                required
              />
              {errors.contact && <p className="error-text">{errors.contact}</p>}
            </label>
            <label>
              <span className="field-label">Whatsapp Number For Communication<span className="required">*</span></span>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                maxLength={10}
                className={errors.whatsapp ? "input-error" : ""}
                required
              />
              {errors.whatsapp && <p className="error-text">{errors.whatsapp}</p>}
            </label>
            <label>
              Student Number
              <input
                type="text"
                name="student_contact"
                value={formData.student_contact || ""}
                onChange={handleInputChange}
                maxLength={10}
                className={errors.student_contact ? "input-error" : ""}
              />
              {errors.student_contact && <p className="error-text">{errors.student_contact}</p>}
            </label>
            <label>
              <span className="field-label"> Enter Email For Further Communication<span className="required">*</span></span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={errors.email ? "input-error" : ""}
                required
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </label>

            <label className="full-width">
              <span className="field-label">Who all are there in the family?<span className="required">*</span></span>
              <input type="text" name="family_members" value={formData.family_members || ""} placeholder="e.g. Mother, Father, 2 siblings" onChange={handleInputChange} required />
            </label>
            <label className="full-width">
              <span className="field-label">Parents Full Names<span className="required">*</span></span>
              <input type="text" name="parents_full_names" value={formData.parents_full_names || ""} placeholder="e.g. Asha Devi (Mother), Rajesh Kumar (Father)" onChange={handleInputChange} required />
            </label>
            <label className="full-width">
              <span className="field-label">Who are the earning members and their Occupation?<span className="required">*</span></span>
              <input type="text" name="earning_members" value={formData.earning_members || ""} placeholder="e.g. Father - Farmer; Mother - Sewing work" onChange={handleInputChange} required />
            </label>
          </div>
        </div>

        {/* Academic Data */}
        <div className="section">
          <h2>2. Academic Data</h2>
          <div className="form-group">
            <label>
              <span className="field-label">Name of School/College/University<span className="required">*</span></span>
              <input type="text" name="school" value={formData.school} onChange={handleInputChange} required />
            </label>
          </div>

          <EducationDropdown
            educationcategory={formData.educationcategory}
            educationsubcategory={formData.educationsubcategory}
            educationyear={formData.educationyear}
            onChange={handleInputChange}
          />

          <div className="form-group">
            <label>
              <span className="field-label">Percentage scored in previous academic year (Not CGPA)<span className="required">*</span></span>
              <input type="text" name="prev_percent" value={formData.prev_percent} onChange={handleInputChange} required />
            </label>
            <label>
              <span className="field-label">Percentage scored in present academic year (Not CGPA)<span className="required">*</span></span>
              <input type="text" name="present_percent" value={formData.present_percent} onChange={handleInputChange} required />
            </label>
          </div>

          <div className="form-group">
            <label className="full-width">
              <span className="field-label">Fee Structure<span className="required">*</span></span>
              <input type="text" name="fee_structure" value={formData.fee_structure || ""} onChange={handleInputChange} className={errors.fee_structure ? 'input-error' : ''} required />
              {errors.fee_structure && <p className="error-text">{errors.fee_structure}</p>}
            </label>
          </div>
        </div>

        {/* Other Details */}
        <h2>3. Other Details</h2>

        {/* --- Does she work to support her family? --- */}
        <div className="form-group">
          <label>Does she work to support her family?</label>

          <div className="radio-inline">
            <label>
              <input
                type="radio"
                name="does_work"
                value="YES"
                checked={formData.does_work === "YES"}
                onChange={handleInputChange}
              />
              Yes
            </label>

            <label>
              <input
                type="radio"
                name="does_work"
                value="NO"
                checked={formData.does_work === "NO"}
                onChange={handleInputChange}
              />
              No
            </label>
          </div>

          {formData.does_work === "YES" && (
            <label className="full-width">
              What kind of job does she do?
              <input
                type="text"
                name="job"
                value={formData.job}
                onChange={handleInputChange}
                placeholder="Describe her occupation"
              />
            </label>
          )}
        </div>

        {/* --- Career Aspiration --- */}
        <div className="form-group">
          <label className="full-width">
            What are her career aspirations and planned courses for the next two years?
            <input
              type="text"
              name="aspiration"
              value={formData.aspiration}
              onChange={handleInputChange}
            />
          </label>
        </div>

        {/* --- Scholarship Question --- */}
        <div className="form-group">
          <label>Is she getting any scholarship / Govt help / financial assistance?</label>

          <div className="radio-inline">
            <label>
              <input
                type="radio"
                name="has_scholarship"
                value="YES"
                checked={formData.has_scholarship === "YES"}
                onChange={handleInputChange}
              />
              Yes
            </label>

            <label>
              <input
                type="radio"
                name="has_scholarship"
                value="NO"
                checked={formData.has_scholarship === "NO"}
                onChange={handleInputChange}
              />
              No
            </label>
          </div>

          {formData.has_scholarship === "YES" && (
            <label className="full-width">
              Scholarship / Assistance Details
              <input
                type="text"
                name="scholarship"
                value={formData.scholarship}
                onChange={handleInputChange}
                placeholder="Enter Scholarship Details"
              />
            </label>
          )}
        </div>

        {/* --- Other Questions --- */}
        <div className="form-group">
          <label className="full-width">
            Achievements
            <input
              type="text"
              name="certificates"
              value={formData.certificates}
              onChange={handleInputChange}
            />
          </label>

          <label className="full-width">
            From how long are they living in this area? (Is she a migrant worker?)
            <input
              type="text"
              name="years_area"
              value={formData.years_area}
              onChange={handleInputChange}
            />
          </label>
        </div>

        {/* Document Upload */}
        <div className="section">
          <h2>4. Document Upload (Size Limit: 50 MB)</h2>

          {renderUploadField("School / College ID", "school_id")}
          {renderUploadField("Aadhaar Card", "aadhaar")}
          {renderUploadField("Income Proof", "income_proof")}
          {renderUploadField("Marks Sheet (Last & Present Year)", "marksheet")}
          {renderUploadField("Passport Size Photo", "passport_photo")}

          <div className="upload-field">
            <span className="bank-details-title">Bank Account Details</span>
            <div className="form-group">
              <label>

                <span className="field-label">Account No.<span className="required">*</span></span>
                <input
                  type="text"
                  name="account_no"
                  value={formData.account_no || ""}
                  onChange={handleInputChange}
                  className={errors.account_no ? "input-error" : ""}
                  required
                />
                {errors.account_no && <p className="error-text">{errors.account_no}</p>}
              </label>
              <label>
                <span className="field-label">Bank Name<span className="required">*</span></span>
                <input type="text" name="bank_name" value={formData.bank_name || ""} onChange={handleInputChange} required />
              </label>
              <label>
                <span className="field-label">Branch<span className="required">*</span></span>
                <input type="text" name="bank_branch" value={formData.bank_branch || ""} onChange={handleInputChange} required />
              </label>
              <label>
                <span className="field-label">Enter valid IFSC Code<span className="required">*</span></span>
                <input
                  type="text"
                  name="ifsc_code"
                  value={formData.ifsc_code || ""}
                  onChange={handleInputChange}
                  className={errors.ifsc_code ? "input-error" : ""}
                  required
                />
                {errors.ifsc_code && <p className="error-text">{errors.ifsc_code}</p>}
              </label>
            </div>
          </div>

          {renderUploadField("Fees Receipt (Upload / Text)", "fees_receipt")}
          {renderUploadField("Volunteer Signature", "volunteer_signature")}
          {renderUploadField("Student Signature", "student_signature")}
        </div>

        {/* Special Remarks */}
        <div className="section">
          <h2>5. Special Remarks</h2>
          <textarea name="special_remarks" value={formData.special_remarks} onChange={handleInputChange} placeholder="Any additional notes or comments" rows={4} style={{ width: "100%" }}></textarea>
        </div>

        <div className="submit-container">
          <button type="submit">{isEditMode ? "Save" : "Submit Application"}</button>
        </div>
      </form>
      </div>
    </div>
  );
}
 