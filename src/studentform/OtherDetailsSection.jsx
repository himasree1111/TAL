import React from "react";

export default function OtherDetailsSection({ formData, handleInputChange, errors }) {
  return (
    <>
      <h2>4. Other Details</h2>

      <div className="form-group">
        <label>Does she work to support her family?<span className="required">*</span></label>
        <div className="radio-inline">
          <label><input type="radio" name="does_work" value="YES" checked={formData.does_work === "YES"} onChange={handleInputChange} /> Yes</label>
          <label><input type="radio" name="does_work" value="NO" checked={formData.does_work === "NO"} onChange={handleInputChange} /> No</label>
        </div>
        {errors.does_work && <p className="error-text">{errors.does_work}</p>}
        {formData.does_work === "YES" && (
          <label className="full-width">
            What kind of job does she do?<span className="required">*</span>
            <input type="text" name="job" value={formData.job} onChange={handleInputChange} placeholder="Describe her occupation" />
          </label>
        )}
      </div>

      <div className="form-group">
        <label className="full-width">
          What are her career aspirations and planned courses for the next two years?
          <input type="text" name="aspiration" value={formData.aspiration} onChange={handleInputChange} />
        </label>
      </div>

      <div className="form-group">
        <label>Is she getting any scholarship / Govt help / financial assistance?<span className="required">*</span></label>
        <div className="radio-inline">
          <label><input type="radio" name="has_scholarship" value="YES" checked={formData.has_scholarship === "YES"} onChange={handleInputChange} /> Yes</label>
          <label><input type="radio" name="has_scholarship" value="NO" checked={formData.has_scholarship === "NO"} onChange={handleInputChange} /> No</label>
        </div>
        {errors.has_scholarship && <p className="error-text">{errors.has_scholarship}</p>}
        {formData.has_scholarship === "YES" && (
          <label className="full-width">
            Scholarship / Assistance Details<span className="required">*</span>
            <input type="text" name="scholarship" value={formData.scholarship} onChange={handleInputChange} placeholder="Enter Scholarship Details" className={errors.scholarship ? "input-error" : ""} />
            {errors.scholarship && <p className="error-text">{errors.scholarship}</p>}
          </label>
        )}
      </div>

      <div className="form-group">
        <label className="full-width">Academic Achievements<input type="text" name="academic_achievements" value={formData.academic_achievements} onChange={handleInputChange} /></label>
        <label className="full-width">Non-Academic Achievements<input type="text" name="non_academic_achievements" value={formData.non_academic_achievements} onChange={handleInputChange} /></label>
        <label className="full-width">From how long are they living in this area? (Is she a migrant worker?)<input type="text" name="years_area" value={formData.years_area} onChange={handleInputChange} /></label>
      </div>
    </>
  );
}
