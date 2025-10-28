import React, { useState } from "react";
import "./StudentForm.css";
import VolunteerProfile from "./VolunteerProfile";

export default function StudentForm() {
  // State for form fields
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    dob: "",
    age: "",
    pob: "",
  nationality: "",
  address: "",
  Class: "",
    email: "",
    contact: "",
    whatsapp: "",
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
    ifsc_code: ""
  });

  // State for file uploads
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
    // If DOB changes, compute age automatically
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

  const allUploaded =
    Object.values(files).every((f) => f !== null) &&
    (formData.account_no || "").toString().trim() !== "" &&
    (formData.bank_name || "").toString().trim() !== "" &&
    (formData.bank_branch || "").toString().trim() !== "" &&
    (formData.ifsc_code || "").toString().trim() !== "";

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mandatory fields check (as requested)
    const mandatoryFields = [
      { key: 'age', label: 'Age' },
      { key: 'address', label: 'Address' },
      { key: 'whatsapp', label: 'Whatsapp Number' },
      { key: 'school', label: 'Name of School/College' },
      { key: 'Class', label: 'Class' },
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

    // Ensure age is at least 6
    const ageVal = formData.age !== "" && formData.age !== null ? Number(formData.age) : null;
    if (ageVal === null || Number.isNaN(ageVal) || ageVal < 6) {
      alert("⚠️ Age must be at least 6 years.");
      return;
    }
    if (!allUploaded) {
      alert("⚠️ Please upload all required documents before submitting.");
      return;
    }
    alert("✅ Student details submitted successfully!");
  };

  const renderUploadField = (label, field) => (
    <div className="upload-field">
      <span className="label">{label}<span className="required">*</span></span>
      <div className="upload-controls">
        <label className="upload-btn">
          <span className="plus-icon">+</span>
          <input
            type="file"
            style={{ display: "none" }}
            onChange={(e) => handleFileChange(e, field)}
          />
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
                required
              />
            </label>
             <label>
              Middle Name
              <input 
                type="text" 
                name="middle_name" 
                value={formData.middle_name}
                onChange={handleInputChange}
              />
            </label>
            <label>
              <span className="field-label">Last Name<span className="required">*</span></span>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleInputChange}
                required
              />
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
                required
              />
            </label>
            <label>
              <span className="field-label">Age<span className="required">*</span></span>
              <input
                type="number"
                name="age"
                value={formData.age}
                min={6}
                onChange={handleInputChange}
                readOnly
                className="readonly-age"
              />
            </label>
            <label>
              Date of Camp 
              <input
                type="text"
                name="pob"
                value={formData.pob}
                onChange={handleInputChange}
              />
            </label>
            <label>
              <span className="field-label">Address<span className="required">*</span></span>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
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
                  required
                />
              </label>

            <label>
              <span className="field-label">Whatsapp Number<span className="required">*</span></span>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
               Student Number
              <input
                type="text"
                name="student_contact"
                value={formData.student_contact || ""}
                onChange={handleInputChange}
              />
            </label>
            <label>
              <span className="field-label">Email (Enter Email ID For Further Communication)<span className="required">*</span></span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </label>
            <label className="full-width">
              <span className="field-label">Who all are there in the family?<span className="required">*</span></span>
              <input
                type="text"
                name="family_members"
                value={formData.family_members || ""}
                placeholder="e.g. Mother, Father, 2 siblings"
                onChange={handleInputChange}
                required
              />
            </label>
            <label className="full-width">
              <span className="field-label">Parents Full Names<span className="required">*</span></span>
              <input
                type="text"
                name="parents_full_names"
                value={formData.parents_full_names || ""}
                placeholder="e.g. Asha Devi (Mother), Rajesh Kumar (Father)"
                onChange={handleInputChange}
                required
              />
            </label>
            <label className="full-width">
              <span className="field-label">Who are the earning members and what do they do?<span className="required">*</span></span>
              <input
                type="text"
                name="earning_members"
                value={formData.earning_members || ""}
                placeholder="e.g. Father - Farmer; Mother - Sewing work"
                onChange={handleInputChange}
                required
              />
            </label>
          </div>
          </div>

          {/* Academic Data: School and Class */}
           <div className="section">
          <h2>2. Academic Data</h2>
          <div className="form-group">
            <label>
              <span className="field-label">Name of School and college<span className="required">*</span></span>
              <input 
                type="text" 
                name="school" 
                value={formData.school}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              <span className="field-label">Class<span className="required">*</span></span>
              <select
                name="Class"
                value={formData.Class || ""}
                onChange={handleInputChange}
                required
              >
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
              <input 
                type="text" 
                name="prev_percent" 
                value={formData.prev_percent}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              <span className="field-label">Percentage scored in present acedemic year<span className="required">*</span></span>
              <input 
                type="text" 
                name="present_percent" 
                value={formData.present_percent}
                onChange={handleInputChange}
                required
              />
            </label>
          </div>
        </div>

        {/* Other Data */}
        <div className="section">
          <h2>3. Other Details</h2>
          <div className="form-group">
            <label>
              <span className="field-label">Fee Structure<span className="required">*</span></span>
              <input 
                type="text" 
                name="fee" 
                value={formData.fee}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              <span className="field-label">Does she work to support her family, If Yes what kind of job?<span className="required">*</span></span>
              <input 
                type="text" 
                name="job" 
                value={formData.job}
                onChange={handleInputChange}
                required
              />
            </label>
          </div>
          <div className="form-group">
            <label>
              <span className="field-label">What are her career aspirations and planned courses for the next two years?<span className="required">*</span></span>
              <input 
                type="text" 
                name="aspiration" 
                value={formData.aspiration}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              <span className="field-label">Is she currently getting any scholarship or Govt help or any financial assistance for her education or health<span className="required">*</span></span>

              <input 
                type="text" 
                name="scholarship" 
                value={formData.scholarship}
                onChange={handleInputChange}
                required
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              <span className="field-label">Achievement Certificates<span className="required">*</span></span>
              <input 
                type="text" 
                name="certificates" 
                value={formData.certificates}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
               <span className="field-label">From how long they living in this Area. Is she temporary living (migrant worker)?<span className="required">*</span></span>
              <input 
                type="text" 
                name="years_area" 
                value={formData.years_area}
                onChange={handleInputChange}
                required
              />
            </label>
          </div>
        </div>
        
        {/* Document Upload Section */}
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
                <input
                  type="text"
                  name="account_no"
                  value={formData.account_no || ""}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                <span className="field-label">Bank Name<span className="required">*</span></span>
                <input
                  type="text"
                  name="bank_name"
                  value={formData.bank_name || ""}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                <span className="field-label">Branch<span className="required">*</span></span>
                <input
                  type="text"
                  name="bank_branch"
                  value={formData.bank_branch || ""}
                  onChange={handleInputChange}
                  required
                />
              </label>
              <label>
                <span className="field-label">IFSC Code<span className="required">*</span></span>
                <input
                  type="text"
                  name="ifsc_code"
                  value={formData.ifsc_code || ""}
                  onChange={handleInputChange}
                  required
                />
              </label>
            </div>
          </div>

          {renderUploadField("Fees Receipt (Upload / Text)", "fees_receipt")}
          
        </div>
   
        {/* Submit */}
        <div className="submit-container">
          <button type="submit" disabled={!allUploaded}>
            Submit Application
          </button>
        </div>
      </form>
    </div>
  );
}