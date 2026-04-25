import React from "react";

const EducationDropdown = ({ educationcategory, educationsubcategory, educationyear, educationcategory_custom, educationsubcategory_custom, educationyear_custom, onChange }) => {
  const isOtherValue = (value) => String(value || "").trim().toLowerCase() === "other";

  // Education dropdown data with hierarchical structure
  const educationData = {
    "SCHOOL": {
      subcategories: null, 
      years: ["8th Class", "9th Class", "10th Class", "11th (CBSE / ISC)","12th (CBSE / ISC)","Other"]
    },
    "INTERMEDIATE (State board)": {
      subcategories: ["MPC", "BiPC", "CEC", "MEC", "HEC", "Vocational", "Other"],
      years: ["1st year", "2nd year", "Other"]
    },
    "ENGINEERING (B.Tech / BE)": {
      subcategories: ["CSE", "ECE", "EEE", "Mechanical", "Civil", "IT", "Chemical", "Aeronautical", "Petroleum", "Mining", "AI & ML", "Data Science", "Cyber Security", "Biotechnology", "Other"],
      years: ["1st Year", "2nd Year", "3rd Year", "4th Year", "Other"]
    },
    "MEDICAL (BiPC Students After Intermediate)": {
      subcategories: {
        "MBBS": ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Other"],
        "BDS": ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Other"],
        "B.Pharmacy": ["1st Year", "2nd Year", "3rd Year", "4th Year", "Other"],
        "Pharm D": ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "6th Year", "Other"],
        "B.Sc Nursing": ["1st Year", "2nd Year", "3rd Year", "Other"],
        "BPT (Physiotherapy)": ["1st Year", "2nd Year", "3rd Year", "Other"],
        "BOT (Occupational Therapy)": ["1st Year", "2nd Year", "3rd Year", "Other"],
        "BSc MLT": ["1st Year", "2nd Year", "3rd Year", "Other"],
        "BSc Radiology": ["1st Year", "2nd Year", "3rd Year", "Other"],
        "BSc Anesthesia": ["1st Year", "2nd Year", "3rd Year", "Other"],
        "BSc Nutrition": ["1st Year", "2nd Year", "3rd Year", "Other"],
        "BSc Biotechnology": ["1st Year", "2nd Year", "3rd Year", "Other"],
        "BSc Agriculture": ["1st Year", "2nd Year", "3rd Year", "Other"],
        "BSc Forensic Science": ["1st Year", "2nd Year", "3rd Year", "Other"],
        "Veterinary (BVSc)": ["1st Year", "2nd Year", "3rd Year", "Other"],
        "Homeopathy (BHMS)": ["1st Year", "2nd Year", "3rd Year", "Other"],
        "Ayurveda (BAMS)": ["1st Year", "2nd Year", "3rd Year", "Other"],
        "Other": ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "6th Year", "Other"]
      }
    },
    "DEGREE (UG REGULAR COURSES)": {
      subcategories: ["Commerce", "B.Com", "BBA", "BCA", "CA Foundation", "CMA", "CS", "Science", "B.Sc (General)", "B.Sc Computer Science", "B.Sc Life Science", "B.Sc Microbiology", "B.Sc Chemistry", "B.Sc Physics", "Arts", "BA", "BA Psychology", "BA English", "BA Journalism", "Others", "BSW", "BFA", "Mass Communication", "Hotel Management", "Other"],
      years: ["1st Year", "2nd Year", "3rd Year", "Other"]
    },
    "DIPLOMA / POLYTECHNIC": {
      subcategories: ["Polytechnic Engineering (All branches)", "DCA", "Web Designing", "Animation & VFX", "Fashion Designing", "Interior Designing", "Photography", "Digital Marketing", "Aviation, Cabin Crew", "Other"],
      years: ["1st Year", "2nd Year", "3rd Year", "Other"]
    },
    "ITI": {
      subcategories: ["Electrician", "Fitter", "Welder", "Mechanic", "Plumber", "Carpenter", "Data Entry", "Computer Operator", "Other"],
      years: ["1st Year", "2nd Year", "Other"]
    },
    "PROFESSIONAL COURSES": {
      subcategories: ["Paramedical", "Nursing", "Teaching (D.Ed, B.Ed)", "Management", "Commerce", "Science", "IT & Software", "Arts & Media", "Vocational", "Fire & Safety", "Event Management", "Culinary / Baking", "Other"],
      years: ["1st Year", "2nd Year", "Other"]
    },
    "POST-GRADUATION (PG)": {
      subcategories: {
        "Engineering PG": ["1st Year", "2nd Year", "Other"],
        "M.Tech": ["1st Year", "2nd Year", "Other"],
        "M.E": ["1st Year", "2nd Year", "Other"],
        "Medical PG": ["1st Year", "2nd Year", "3rd Year", "Other"],
        "MD": ["1st Year", "2nd Year", "3rd Year", "Other"],
        "MS": ["1st Year", "2nd Year", "3rd Year", "Other"],
        "MDS": ["1st Year", "2nd Year", "3rd Year", "Other"],
        "Pharm D (PG)": ["1st Year", "2nd Year", "Other"],
        "Degree PG": ["1st Year", "2nd Year", "Other"],
        "MBA": ["1st Year", "2nd Year", "Other"],
        "MCA": ["1st Year", "2nd Year", "Other"],
        "M.Com": ["1st Year", "2nd Year", "Other"],
        "M.Sc (All Streams)": ["1st Year", "2nd Year", "Other"],
        "MA": ["1st Year", "2nd Year", "Other"],
        "Other": ["1st Year", "2nd Year", "Other"],
        "PG Diploma": ["1st Year", "2nd Year", "Other"],
        "MPH (Public Health)": ["1st Year", "2nd Year", "Other"],
        "LLM (Law PG)": ["1st Year", "2nd Year", "Other"]
      }
    },
    "Other": {
      subcategories: ["Other"],
      years: ["Other"]
    }
  };

  const educationCategories = Object.keys(educationData);
  const showCategoryCustom = isOtherValue(educationcategory) || Boolean(educationcategory_custom);
  const normalizedEducationCategory = showCategoryCustom ? "Other" : (educationcategory || "");
  const showSubcategoryCustom = isOtherValue(educationsubcategory) || Boolean(educationsubcategory_custom);
  const normalizedEducationSubcategory = showSubcategoryCustom ? "Other" : (educationsubcategory || "");
  const showYearCustom = isOtherValue(educationyear) || Boolean(educationyear_custom);
  const normalizedEducationYear = showYearCustom ? "Other" : (educationyear || "");

  const currentData = educationData[normalizedEducationCategory];
  const hassubcategories = currentData && currentData.subcategories;
  const subcategories = hassubcategories && currentData.subcategories ? (Array.isArray(currentData.subcategories) ? currentData.subcategories : Object.keys(currentData.subcategories)) : [];
  const years = hassubcategories && normalizedEducationSubcategory && typeof currentData.subcategories === 'object' && currentData.subcategories[normalizedEducationSubcategory] ? currentData.subcategories[normalizedEducationSubcategory] : (currentData && currentData.years ? currentData.years : []);

  return (
    <div className="form-group">
      <label>
        <span className="field-label">Education Level<span className="required">*</span></span>
        <select
          name="educationcategory"
          value={normalizedEducationCategory}
          onChange={onChange}
          required
        >
          <option value="">Select Education Level</option>
          {educationCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

{showCategoryCustom ? (
        <>
          <label style={{ marginTop: "12px" }}>
            <span className="field-label">Specify Education Level<span className="required">*</span></span>
            <input
              type="text"
              name="educationcategory_custom"
              value={educationcategory_custom || ""}
              onChange={onChange}
              placeholder="Enter your education level"
              required
            />
          </label>
          <label style={{ marginTop: "12px" }}>
            <span className="field-label">Specify Stream/Branch/Course<span className="required">*</span></span>
            <input
              type="text"
              name="educationsubcategory_custom"
              value={educationsubcategory_custom || ""}
              onChange={onChange}
              placeholder="Enter your stream/branch/course"
              required
            />
          </label>
          <label style={{ marginTop: "12px" }}>
            <span className="field-label">Specify Academic Year<span className="required">*</span></span>
            <input
              type="text"
              name="educationyear_custom"
              value={educationyear_custom || ""}
              onChange={onChange}
              placeholder="Enter your academic year"
              required
            />
          </label>
        </>
      ) : (
        <>
          {educationcategory && hassubcategories && (
            <label style={{ marginTop: "12px" }}>
              <span className="field-label">Stream/Branch/Course<span className="required">*</span></span>
              <select
                name="educationsubcategory"
                value={normalizedEducationSubcategory}
                onChange={onChange}
                required
              >
                <option value="">Select Stream/Branch/Course</option>
                {subcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </label>
          )}

          {showSubcategoryCustom && (
            <label style={{ marginTop: "12px" }}>
              <span className="field-label">Specify Stream/Branch/Course<span className="required">*</span></span>
              <input
                type="text"
                name="educationsubcategory_custom"
                value={educationsubcategory_custom || ""}
                onChange={onChange}
                placeholder="Enter your stream/branch/course"
                required
              />
            </label>
          )}

          {normalizedEducationCategory && (!hassubcategories || normalizedEducationSubcategory) && (
            <label style={{ marginTop: "12px" }}>
              <span className="field-label">Currently Pursuing Year<span className="required">*</span></span>
              <select
                name="educationyear"
                value={normalizedEducationYear}
                onChange={onChange}
                required
              >
                <option value="">Select Year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          )}

          {showYearCustom && (
            <label style={{ marginTop: "12px" }}>
              <span className="field-label">Specify Academic Year<span className="required">*</span></span>
              <input
                type="text"
                name="educationyear_custom"
                value={educationyear_custom || ""}
                onChange={onChange}
                placeholder="Enter your academic year"
                required
              />
            </label>
          )}
        </>
      )}
    </div>
  );
};

export default EducationDropdown;
