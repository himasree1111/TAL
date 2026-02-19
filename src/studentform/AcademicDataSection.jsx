import React from "react";
import EducationDropdown from "../EducationDropdown";

export default function AcademicDataSection({ formData, handleInputChange, errors }) {
  return (
    <div className="section">
      <h2>3. Academic Data</h2>
      <div className="form-group">
        <label>
          <span className="field-label">Name of School/College/University(with Branch Name)<span className="required">*</span></span>
          <input type="text" name="school" value={formData.school} onChange={handleInputChange} required />
        </label>
      </div>

      <EducationDropdown
        educationcategory={formData.educationcategory}
        educationsubcategory={formData.educationsubcategory}
        educationyear={formData.educationyear}
        educationcategory_custom={formData.educationcategory_custom}
        educationsubcategory_custom={formData.educationsubcategory_custom}
        educationyear_custom={formData.educationyear_custom}
        onChange={handleInputChange}
      />

      <div className="form-group">
        <label>
          <span className="field-label">Percentage scored in previous academic year (Not CGPA)<span className="required">*</span></span>
          <input type="text" name="prev_percent" value={formData.prev_percent} onChange={handleInputChange} className={errors.prev_percent ? "input-error" : ""} required />
          {errors.prev_percent && <p className="error-text">{errors.prev_percent}</p>}
        </label>
        <label>
          <span className="field-label">Percentage scored in present academic year (Not CGPA)<span className="required">*</span></span>
          <input type="text" name="present_percent" value={formData.present_percent} onChange={handleInputChange} className={errors.present_percent ? "input-error" : ""} required />
          {errors.present_percent && <p className="error-text">{errors.present_percent}</p>}
        </label>
      </div>

      <div className="form-group">
        <label className="full-width">
          <span className="field-label">Tuition Fee<span className="required">*</span></span>
          <input type="text" name="fee_structure" value={formData.fee_structure || ""} onChange={handleInputChange} className={errors.fee_structure ? "input-error" : ""} required placeholder="Enter tuition fee amount" />
          {errors.fee_structure && <p className="error-text">{errors.fee_structure}</p>}
        </label>
      </div>
    </div>
  );
}
