// src/StudentForm.js
import React, { useState, useEffect } from "react";
import "./StudentForm.css";
import VolunteerProfile from "./VolunteerProfile";
import supabase from "./supabaseClient";

/*
  NOTE: This file preserves your UI exactly and only adds Supabase integration:
  - Uploads files to storage bucket: "student_documents"
  - Inserts a record into table: "student_details"
  - Attaches volunteer's logged-in email as volunteer_email
*/

export default function StudentForm() {
  const [volunteerEmail, setVolunteerEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");  

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
    email: "",
    contact: "",
    whatsapp: "",
    student_contact: "",
    school: "",
    branch: "",
    prev_percent: "",
    present_percent: "",
    fee: "",
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;

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
      setFormData({ ...formData, dob: value, age: computedAge });
      return;
    }

    setFormData({ ...formData, [name]: value });
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation - keep same mandatory checks you wanted
    const mandatoryFields = [
      { key: 'age', label: 'Age' },
      { key: 'address', label: 'Address' },
      { key: 'whatsapp', label: 'Whatsapp Number' },
      { key: 'school', label: 'Name of School/College' },
      { key: 'class', label: 'Class' },
      { key: 'prev_percent', label: 'Previous Year Percentage' },
      { key: 'present_percent', label: 'Present Year Percentage' },
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
      alert('⚠️ Please fill in all mandatory fields: ' + missing.map(m => m.label).join(', '));
      return;
    }

    // Age check
    const ageVal = formData.age !== "" && formData.age !== null ? Number(formData.age) : null;
    if (ageVal === null || Number.isNaN(ageVal) || ageVal < 6) {
      alert("⚠️ Age must be at least 6 years.");
      return;
    }

    // Ensure volunteer is logged in (we attach email)
    if (!volunteerEmail) {
      alert("⚠️ Volunteer not logged in — student will still be saved locally if needed. Please sign in.");
      // but proceed to save? We'll stop to avoid orphan records.
      return;
    }

    // Build a folder name for storage
    const studentFolder = `${formData.first_name}_${formData.last_name}_${Date.now()}`.replace(/\s+/g, "_");

    try {
      // Upload files (if present)
      const uploadedFileUrls = {};
      for (const fKey of Object.keys(files)) {
        if (files[fKey]) {
          try {
            const publicUrl = await uploadFileToStorage(files[fKey], studentFolder);
            uploadedFileUrls[fKey] = publicUrl;
          } catch (upErr) {
            console.error(`Failed to upload ${fKey}`, upErr);
            // continue without breaking — file not required
            uploadedFileUrls[fKey] = null;
          }
        } else {
          uploadedFileUrls[fKey] = null;
        }
      }

      // Prepare payload for DB. Use same field names as your form.
      const payload = {
        ...formData,
        volunteer_email: volunteerEmail,
        created_at: new Date().toISOString(),
        // attach uploaded file URLs by their keys
        school_id_url: uploadedFileUrls.school_id ?? null,
        aadhaar_url: uploadedFileUrls.aadhaar ?? null,
        income_proof_url: uploadedFileUrls.income_proof ?? null,
        marksheet_url: uploadedFileUrls.marksheet ?? null,
        passport_photo_url: uploadedFileUrls.passport_photo ?? null,
        fees_receipt_url: uploadedFileUrls.fees_receipt ?? null,
        volunteer_signature_url: uploadedFileUrls.volunteer_signature ?? null,
        student_signature_url: uploadedFileUrls.student_signature ?? null
      };

      // Insert record
      const { error: insertError } = await supabase.from("student_details").insert([payload]);

      if (insertError) {
        console.error("Insert error details:", insertError);
        alert("❌ Error saving student: " + insertError.message);
        return;
      }

    // Success
    alert("🎉 Form submitted successfully!");

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
      email: "",
      contact: "",
      whatsapp: "",
      student_contact: "",
      school: "",
      branch: "",
      prev_percent: "",
      present_percent: "",
      fee: "",
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
    <div className="form-container">
      <VolunteerProfile />
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
              <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} required />
            </label>
            <label>
              Middle Name
              <input type="text" name="middle_name" value={formData.middle_name} onChange={handleInputChange} />
            </label>
            <label>
              <span className="field-label">Last Name<span className="required">*</span></span>
              <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} required />
            </label>
          </div>

          <div className="form-group">
            <label>
              Date of Birth
              <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} required />
            </label>
            <label>
              <span className="field-label">Age<span className="required">*</span></span>
              <input type="number" name="age" value={formData.age} min={6} readOnly className="readonly-age" onChange={handleInputChange} />
            </label>
            <label>
              Date of Camp
              <input type="text" name="pob" value={formData.pob} onChange={handleInputChange} />
            </label>
            <label>
              Name of Camp
              <input type="text" name="camp_name" value={formData.camp_name} onChange={handleInputChange} />
            </label>
            <label>
              <span className="field-label">Address<span className="required">*</span></span>
              <input type="text" name="address" value={formData.address} onChange={handleInputChange} required />
            </label>
          </div>

          <div className="form-group">
            <label>
              <span className="field-label">Parent Number<span className="required">*</span></span>
              <input type="text" name="contact" value={formData.contact} onChange={handleInputChange} required />
            </label>
            <label>
              <span className="field-label">Whatsapp Number<span className="required">*</span></span>
              <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} required />
            </label>
            <label>
              Student Number
              <input type="text" name="student_contact" value={formData.student_contact || ""} onChange={handleInputChange} />
            </label>
            <label>
              <span className="field-label">Email ( For Further Communication)<span className="required">*</span></span>
              <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
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
              <span className="field-label">Who are the earning members and what do they do?<span className="required">*</span></span>
              <input type="text" name="earning_members" value={formData.earning_members || ""} placeholder="e.g. Father - Farmer; Mother - Sewing work" onChange={handleInputChange} required />
            </label>
          </div>
        </div>

        {/* Academic Data */}
        <div className="section">
          <h2>2. Academic Data</h2>
          <div className="form-group">
            <label>
              <span className="field-label">Name of School/College<span className="required">*</span></span>
              <input type="text" name="school" value={formData.school} onChange={handleInputChange} required />
            </label>
            <label>
              <span className="field-label">Class<span className="required">*</span></span>
              <select name="class" value={formData.class || ""} onChange={handleInputChange} required>
                <option value="">Select class</option>
                <option value="8th">8th</option>
                <option value="9th">9th</option>
                <option value="10th">10th</option>
                <option value="11th">11th</option>
                <option value="12th">12th</option>
                <option value="B.Tech 1st Year">B.Tech 1st Year</option>
                <option value="B.Tech 2nd Year">B.Tech 2nd Year</option>
                <option value="B.Tech 3rd Year">B.Tech 3rd Year</option>
                <option value="B.Tech 4th Year">B.Tech 4th Year</option>
                <option value="B.Com">B.Com</option>
                <option value="Other">Other</option>
              </select>
            </label>
          </div>

          <div className="form-group">
            <label>
              <span className="field-label">Percentage scored in previous academic year<span className="required">*</span></span>
              <input type="text" name="prev_percent" value={formData.prev_percent} onChange={handleInputChange} required />
            </label>
            <label>
              <span className="field-label">Percentage scored in present academic year<span className="required">*</span></span>
              <input type="text" name="present_percent" value={formData.present_percent} onChange={handleInputChange} required />
            </label>
          </div>
        </div>

        {/* Other Details */}
        <div className="section">
          <h2>3. Other Details</h2>
          <div className="form-group">
            <label>
              Fee Structure
              <input type="text" name="fee" value={formData.fee} onChange={handleInputChange} />
            </label>
            <label>
              Does she work to support her family, If Yes what kind of job?
              <input type="text" name="job" value={formData.job} onChange={handleInputChange} />
            </label>
          </div>

          <div className="form-group">
            <label>
              What are her career aspirations and planned courses for the next two years?
              <input type="text" name="aspiration" value={formData.aspiration} onChange={handleInputChange} />
            </label>
            <label>
              Is she currently getting any scholarship or Govt help or any financial assistance for her education or health
              <input type="text" name="scholarship" value={formData.scholarship} onChange={handleInputChange} />
            </label>
          </div>

          <div className="form-group">
            <label>
              Achievement Certificates
              <input type="text" name="certificates" value={formData.certificates} onChange={handleInputChange} />
            </label>
            <label>
              From how long they living in this Area. Is she temporary living (migrant worker)?
              <input type="text" name="years_area" value={formData.years_area} onChange={handleInputChange} />
            </label>
          </div>
        </div>

        {/* Document Upload */}
        <div className="section">
          <h2>4. Document Upload</h2>

          {renderUploadField("School / College ID", "school_id")}
          {renderUploadField("Aadhaar Card", "aadhaar")}
          {renderUploadField("Income Proof", "income_proof")}
          {renderUploadField("Marks Sheet (Last & Present Year)", "marksheet")}
          {renderUploadField("Passport Size Photo", "passport_photo")}

          <div className="upload-field">
            <span className="label">Bank Account Details</span>
            <div className="form-group">
              <label>
                <span className="field-label">Account No.<span className="required">*</span></span>
                <input type="text" name="account_no" value={formData.account_no || ""} onChange={handleInputChange} required />
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
                <span className="field-label">IFSC Code<span className="required">*</span></span>
                <input type="text" name="ifsc_code" value={formData.ifsc_code || ""} onChange={handleInputChange} required />
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
          <button type="submit">Submit Application</button>
        </div>
      </form>
    </div>
  );
}
