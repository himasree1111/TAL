import React from "react";

export default function VolunteerSection({ formData, handleInputChange, errors, userRole }) {
  return (
    <div className="section">
      <h2>1. Volunteer Details {userRole === "student" && <span style={{ fontSize: "0.8em", color: "#888" }}>(Optional)</span>}</h2>
      <div className="form-group">
        <label>
          <span className="field-label">Name{userRole !== "student" && <span className="required">*</span>}</span>
          <input type="text" name="volunteer_name" value={formData.volunteer_name} onChange={handleInputChange} className={errors.volunteer_name ? "input-error" : ""} placeholder="Enter Name" required={userRole !== "student"} />
          {errors.volunteer_name && <p className="error-text">{errors.volunteer_name}</p>}
        </label>
        <label>
          <span className="field-label">Contact Number{userRole !== "student" && <span className="required">*</span>}</span>
          <input type="text" name="volunteer_contact" value={formData.volunteer_contact || ""} onChange={handleInputChange} placeholder="Enter Contact Number" maxLength={10} className={errors.volunteer_contact ? "input-error" : ""} required={userRole !== "student"} />
          {errors.volunteer_contact && <p className="error-text">{errors.volunteer_contact}</p>}
        </label>
      </div>
    </div>
  );
}
