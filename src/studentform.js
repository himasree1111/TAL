import React, { useState } from "react";
import "./StudentForm.css";

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
    years_area: ""
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

  const [bankAccount, setBankAccount] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, [field]: file });
    }
  };

  const allUploaded =
    Object.values(files).every((f) => f !== null) && bankAccount.trim() !== "";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim() || !formData.contact.trim()) {
      alert("⚠️ Please fill in all mandatory fields: First Name, Last Name, Email, and Parent Number.");
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
      <span className="label">{label}</span>
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
              Age
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Place of Birth
              <input
                type="text"
                name="pob"
                value={formData.pob}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Address
              <input
                type="text"
                name="address"
                value={formData.nationality}
                onChange={handleInputChange}
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
              Whatsapp Number
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
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
              <span className="field-label">Email<span className="required">*</span></span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </label>
          </div>
        </div>

        {/* Academic Data */}
        <div className="section">
          <h2>2. Academic Details</h2>
          <div className="form-group">
            <label>
              Name of School and college
              <input 
                type="text" 
                name="school" 
                value={formData.school}
                onChange={handleInputChange}
                required
              />
            </label>
            <label>
              Which Branch
              <input 
                type="text" 
                name="branch" 
                value={formData.branch}
                onChange={handleInputChange}
              />
            </label>
          </div>

          <div className="form-group">
            <label>
             Percentage scored in previous academic year
              <input 
                type="text" 
                name="prev_percent" 
                value={formData.prev_percent}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Percentage scored in present acedemic year
              <input 
                type="text" 
                name="present_percent" 
                value={formData.present_percent}
                onChange={handleInputChange}
              />
            </label>
          </div>
        </div>

        {/* Other Data */}
        <div className="section">
          <h2>3. Other Details</h2>
          <div className="form-group">
            <label>
              Course / Class Fee
              <input 
                type="text" 
                name="fee" 
                value={formData.fee}
                onChange={handleInputChange}
              />
            </label>
            <label>
             Does she work to support her family, If Yes what kind of job?
              <input 
                type="text" 
                name="job" 
                value={formData.job}
                onChange={handleInputChange}
              />
            </label>
          </div>

          <div className="form-group">
            <label>
"What are her career aspirations and planned courses for the next two years?"
              <input 
                type="text" 
                name="aspiration" 
                value={formData.aspiration}
                onChange={handleInputChange}
              />
            </label>
            <label>
              Is she currently getting any scholarship or Govt help or any financial assistance for her education or
health

              <input 
                type="text" 
                name="scholarship" 
                value={formData.scholarship}
                onChange={handleInputChange}
              />
            </label>
          </div>

          <div className="form-group">
            <label>
              Achievement Certificates
              <input 
                type="text" 
                name="certificates" 
                value={formData.certificates}
                onChange={handleInputChange}
              />
            </label>
            <label>
               From how long they living in this Area. Is she temporary living (migrant worker)?
              <input 
                type="text" 
                name="years_area" 
                value={formData.years_area}
                onChange={handleInputChange}
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
            <input
              type="text"
              placeholder="Enter bank account details"
              value={bankAccount}
              onChange={(e) => setBankAccount(e.target.value)}
              required
            />
          </div>

          {renderUploadField("Fees Receipt (Upload / Text)", "fees_receipt")}
          {renderUploadField("Volunteer Signature", "volunteer_signature")}
          {renderUploadField("Student Signature", "student_signature")}
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