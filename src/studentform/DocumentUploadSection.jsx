import React from "react";

export default function DocumentUploadSection({ formData, handleInputChange, errors, files, handleFileChange }) {
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
            <span className="tick">{"\u2713"}</span> {files[field].name}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="section">
      <h2>5. Document Upload (Size Limit: 50 MB)</h2>

      {renderUploadField("School / College ID", "school_id")}
      {renderUploadField("Aadhaar Card", "aadhaar")}
      {renderUploadField("Income Proof", "income_proof")}
      {renderUploadField("Marks Sheet (Last & Present Year)", "marksheet")}
      {renderUploadField("Passport Size Photo", "passport_photo")}

      <div className="upload-field">
        <span className="bank-details-title">Bank Account Details</span>
        <div className="form-group">
          <label>
            <span className="field-label">Account No.<span className="form-group"></span></span>
            <input type="text" name="account_no" value={formData.account_no || ""} onChange={handleInputChange} className={errors.account_no ? "input-error" : ""} />
            {errors.account_no && <p className="error-text">{errors.account_no}</p>}
          </label>
          <label>
            <span className="field-label">Bank Name<span className="form-group"></span></span>
            <input type="text" name="bank_name" value={formData.bank_name || ""} onChange={handleInputChange} />
          </label>
          <label>
            <span className="field-label">Branch<span className="form-group"></span></span>
            <input type="text" name="bank_branch" value={formData.bank_branch || ""} onChange={handleInputChange} />
          </label>
          <label>
            <span className="field-label">Enter valid IFSC Code<span className="form-group"></span></span>
            <input type="text" name="ifsc_code" value={formData.ifsc_code || ""} onChange={handleInputChange} className={errors.ifsc_code ? "input-error" : ""} />
            {errors.ifsc_code && <p className="error-text">{errors.ifsc_code}</p>}
          </label>
        </div>
      </div>

      {renderUploadField("Fees Receipt (Upload / Text)", "fees_receipt")}
    </div>
  );
}
