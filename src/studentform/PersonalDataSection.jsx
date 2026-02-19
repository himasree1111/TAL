import React from "react";

export default function PersonalDataSection({ formData, handleInputChange, errors }) {
  const renderFamilyMembers = () => {
    const num = parseInt(formData.num_family_members) || 0;
    if (num <= 0) return null;
    return (
      <div className="family-members-section">
        <h3>Family Details</h3>
        {Array.from({ length: num }, (_, index) => (
          <div key={index} className="family-member-card">
            <div className="form-group">
              <label>
                <span className="field-label"> Name<span className="required">*</span></span>
                <input type="text" name={`family_member_name_${index}`} value={formData.family_members_details[index]?.name || ""} onChange={handleInputChange} placeholder="Enter Name" />
              </label>
              <label>
                <span className="field-label">Relationship with Applicant<span className="required">*</span></span>
                <input type="text" name={`family_member_relation_${index}`} value={formData.family_members_details[index]?.relation || ""} onChange={handleInputChange} placeholder="Enter relationship" />
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEarningMembers = () => {
    const num = parseInt(formData.num_earning_members) || 0;
    if (num <= 0) return null;
    return (
      <div className="earning-members-section">
        <h3>Details of Earning Family Members</h3>
        {Array.from({ length: num }, (_, index) => (
          <div key={index} className="earning-member-group">
            <div className="form-group">
              <label>
                <span className="field-label">Relation<span className="required">*</span></span>
                <input type="text" name={`earning_member_name_${index}`} value={formData.earning_members_details[index]?.name || ""} onChange={handleInputChange} />
              </label>
              <label>
                <span className="field-label"> Occupation<span className="required">*</span></span>
                <input type="text" name={`earning_member_occ_${index}`} value={formData.earning_members_details[index]?.occupation || ""} onChange={handleInputChange} />
              </label>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="section">
      <h2>2. Student Data</h2>
      <div className="form-group">
        <label>
          <span className="field-label">First Name<span className="required">*</span></span>
          <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} className={errors.first_name ? "input-error" : ""} required />
          {errors.first_name && <p className="error-text">{errors.first_name}</p>}
        </label>
        <label>
          Middle Name
          <input type="text" name="middle_name" value={formData.middle_name} onChange={handleInputChange} className={errors.middle_name ? "input-error" : ""} />
          {errors.middle_name && <p className="error-text">{errors.middle_name}</p>}
        </label>
        <label>
          <span className="field-label">Last Name<span className="required">*</span></span>
          <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} className={errors.last_name ? "input-error" : ""} required />
          {errors.last_name && <p className="error-text">{errors.last_name}</p>}
        </label>
      </div>

      <div className="form-group">
        <label>Date of Birth<input type="date" name="dob" value={formData.dob} onChange={handleInputChange} min="1980-01-01" max="2024-12-31" required /></label>
        <label>
          <span className="field-label">Age<span className="required">*</span></span>
          <input type="number" name="age" value={formData.age} min={6} readOnly className="readonly-age" onChange={handleInputChange} />
          {errors.age && <p className="error-text">{errors.age}</p>}
        </label>
        <label><span className="field-label">Name of Camp<span className="required">*</span></span><input type="text" name="camp_name" value={formData.camp_name} onChange={handleInputChange} /></label>
        <label>Date of Camp<span className="required">*</span><input type="date" name="camp_date" value={formData.camp_date} onChange={handleInputChange} required /></label>
        <label><span className="field-label">Student's Address<span className="required">*</span></span><input type="text" name="address" value={formData.address} onChange={handleInputChange} required /></label>
      </div>

      <div className="form-group">
        <label>Father's Name<input type="text" name="father_name" value={formData.father_name} onChange={handleInputChange} /></label>
        <label>Mother's Name<input type="text" name="mother_name" value={formData.mother_name} onChange={handleInputChange} /></label>
        <label>Guardian's Name<input type="text" name="guardian_name" value={formData.guardian_name} onChange={handleInputChange} /></label>
        <label>Head of Family<input type="text" name="head_of_family" value={formData.head_of_family} onChange={handleInputChange} /></label>
      </div>

      <div className="form-group">
        <label>Income Source<input type="text" name="income_source" value={formData.income_source} onChange={handleInputChange} placeholder="e.g. Agriculture, Daily wages" /></label>
        <label>Monthly Income ({"\u20B9"})<input type="number" name="monthly_income" value={formData.monthly_income} onChange={handleInputChange} min="0" placeholder="e.g. 10000" /></label>
        <label>No. of Dependents<input type="number" name="num_dependents" value={formData.num_dependents} onChange={handleInputChange} min="0" max="20" /></label>
        <label>School/College Address<input type="text" name="school_address" value={formData.school_address} onChange={handleInputChange} placeholder="Separate from home address" /></label>
      </div>

      <div className="form-group">
        <label>
          <span className="field-label">Parent's Contact Number<span className="required">*</span></span>
          <input type="text" name="contact" value={formData.contact} onChange={handleInputChange} maxLength={10} className={errors.contact ? "input-error" : ""} required />
          {errors.contact && <p className="error-text">{errors.contact}</p>}
        </label>
        <label>
          <span className="field-label">Whatsapp Number(For Communication)<span className="required">*</span></span>
          <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} maxLength={10} className={errors.whatsapp ? "input-error" : ""} required />
          {errors.whatsapp && <p className="error-text">{errors.whatsapp}</p>}
        </label>
        <label>
          Student's Contact Number
          <input type="text" name="student_contact" value={formData.student_contact || ""} onChange={handleInputChange} maxLength={10} className={errors.student_contact ? "input-error" : ""} />
          {errors.student_contact && <p className="error-text">{errors.student_contact}</p>}
        </label>
        <label>
          <span className="field-label">Email(For Further Communication)<span className="required">*</span></span>
          <input type="email" name="email" value={formData.email} onChange={handleInputChange} className={errors.email ? "input-error" : ""} required />
          {errors.email && <p className="error-text">{errors.email}</p>}
        </label>
      </div>

      <div className="form-group">
        <label>Is she currently being raised by a single parent or guardian?<span className="required">*</span></label>
        <div className="radio-inline">
          <label><input type="radio" name="is_single_parent" value="YES" checked={formData.is_single_parent === "YES"} onChange={handleInputChange} /> Yes</label>
          <label><input type="radio" name="is_single_parent" value="NO" checked={formData.is_single_parent === "NO"} onChange={handleInputChange} /> No</label>
        </div>
        {errors.is_single_parent && <p className="error-text">{errors.is_single_parent}</p>}
      </div>

      <div className="form-group">
        <label className="full-width">
          <span className="field-label">Total number of family members?<span className="required">*</span></span>
          <input type="number" name="num_family_members" value={formData.num_family_members} onChange={handleInputChange} min="1" max="15" placeholder="Enter total number of family members" required />
        </label>
        {renderFamilyMembers()}
        {errors.family_members && <p className="error-text">{errors.family_members}</p>}
        <label className="full-width">
          <span className="field-label">Number of earning members in the family?<span className="required">*</span></span>
          <input type="number" name="num_earning_members" value={formData.num_earning_members} onChange={handleInputChange} min="0" max="10" placeholder="Enter number of earning members" required />
        </label>
        {renderEarningMembers()}
        {errors.earning_members && <p className="error-text">{errors.earning_members}</p>}
      </div>
    </div>
  );
}
