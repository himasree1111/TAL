// StudentDocsUpload.js
import React, { useState } from "react";
// import { FaCheckCircle, FaPlus } from "react-icons/fa";
import "./StudentDocs.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function StudentDocsUpload() {
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
    if (!allUploaded) {
      toast.warn("Please upload all required documents before submitting.");
      return;
    }
    toast.success("Student details submitted successfully!");
  };

  const renderUploadField = (label, field) => (
    <div className="upload-field">
      <span className="label">{label}</span>
      <div className="upload-controls">
        <label className="upload-btn">
          <FaPlus />
          <input
            type="file"
            style={{ display: "none" }}
            onChange={(e) => handleFileChange(e, field)}
          />
        </label>
        {files[field] && (
          <span className="file-info">
            <FaCheckCircle className="tick" /> {files[field].name}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <ToastContainer position="top-right" autoClose={3000} />
      <h2>📑 Upload Student Documents</h2>

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
        />
      </div>

      {renderUploadField("Fees Receipt (Upload / Text)", "fees_receipt")}
      {renderUploadField("Volunteer Signature", "volunteer_signature")}
      {renderUploadField("Student Signature", "student_signature")}

      <button type="submit" className="submit-btn" disabled={!allUploaded}>
        Submit Student Details
      </button>
    </form>
  );
}