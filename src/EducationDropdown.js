import React from "react";

const EducationDropdown = ({ educationcategory, educationsubcategory, educationyear, onChange }) => {
  // Education dropdown data with hierarchical structure
  const educationData = {
    "SCHOOL": {
      subcategories: null,
      years: ["8th Class", "9th Class", "10th Class"]
    },
    "INTERMEDIATE": {
      subcategories: ["MPC", "BiPC", "CEC", "MEC", "HEC", "Vocational"],
      years: ["11th", "12th"]
    },
    "ENGINEERING (B.Tech / BE)": {
      subcategories: ["CSE", "ECE", "EEE", "Mechanical", "Civil", "IT", "Chemical", "Aeronautical", "Petroleum", "Mining", "AI & ML", "Data Science", "Cyber Security", "Biotechnology", "Other"],
      years: ["1st Year", "2nd Year", "3rd Year", "4th Year"]
    },
    "MEDICAL (BiPC Students After Intermediate)": {
      subcategories: {
        "MBBS": ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"],
        "BDS": ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"],
        "B.Pharmacy": ["1st Year", "2nd Year", "3rd Year", "4th Year"],
        "Pharm D": ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "6th Year"],
        "B.Sc Nursing": ["1st Year", "2nd Year", "3rd Year"],
        "BPT (Physiotherapy)": ["1st Year", "2nd Year", "3rd Year"],
        "BOT (Occupational Therapy)": ["1st Year", "2nd Year", "3rd Year"],
        "BSc MLT": ["1st Year", "2nd Year", "3rd Year"],
        "BSc Radiology": ["1st Year", "2nd Year", "3rd Year"],
        "BSc Anesthesia": ["1st Year", "2nd Year", "3rd Year"],
        "BSc Nutrition": ["1st Year", "2nd Year", "3rd Year"],
        "BSc Biotechnology": ["1st Year", "2nd Year", "3rd Year"],
        "BSc Agriculture": ["1st Year", "2nd Year", "3rd Year"],
        "BSc Forensic Science": ["1st Year", "2nd Year", "3rd Year"],
        "Veterinary (BVSc)": ["1st Year", "2nd Year", "3rd Year"],
        "Homeopathy (BHMS)": ["1st Year", "2nd Year", "3rd Year"],
        "Ayurveda (BAMS)": ["1st Year", "2nd Year", "3rd Year"]
      }
    },
    "DEGREE (UG REGULAR COURSES)": {
      subcategories: ["Commerce", "B.Com", "BBA", "BCA", "CA Foundation", "CMA", "CS", "Science", "B.Sc (General)", "B.Sc Computer Science", "B.Sc Life Science", "B.Sc Microbiology", "B.Sc Chemistry", "B.Sc Physics", "Arts", "BA", "BA Psychology", "BA English", "BA Journalism", "Others", "BSW", "BFA", "Mass Communication", "Hotel Management"],
      years: ["1st Year", "2nd Year", "3rd Year"]
    },
    "DIPLOMA / POLYTECHNIC": {
      subcategories: ["Polytechnic Engineering (All branches)", "DCA", "Web Designing", "Animation & VFX", "Fashion Designing", "Interior Designing", "Photography", "Digital Marketing", "Aviation, Cabin Crew"],
      years: ["1st Year", "2nd Year", "3rd Year"]
    },
    "ITI": {
      subcategories: ["Electrician", "Fitter", "Welder", "Mechanic", "Plumber", "Carpenter", "Data Entry", "Computer Operator"],
      years: ["1st Year", "2nd Year"]
    },
    "PROFESSIONAL COURSES": {
      subcategories: ["Paramedical", "Nursing", "Teaching (D.Ed, B.Ed)", "Management", "Commerce", "Science", "IT & Software", "Arts & Media", "Vocational", "Fire & Safety", "Event Management", "Culinary / Baking"],
      years: ["1st Year", "2nd Year"]
    },
    "POST-GRADUATION (PG)": {
      subcategories: {
        "Engineering PG": ["1st Year", "2nd Year"],
        "M.Tech": ["1st Year", "2nd Year"],
        "M.E": ["1st Year", "2nd Year"],
        "Medical PG": ["1st Year", "2nd Year", "3rd Year"],
        "MD": ["1st Year", "2nd Year", "3rd Year"],
        "MS": ["1st Year", "2nd Year", "3rd Year"],
        "MDS": ["1st Year", "2nd Year", "3rd Year"],
        "Pharm D (PG)": ["1st Year", "2nd Year"],
        "Degree PG": ["1st Year", "2nd Year"],
        "MBA": ["1st Year", "2nd Year"],
        "MCA": ["1st Year", "2nd Year"],
        "M.Com": ["1st Year", "2nd Year"],
        "M.Sc (All Streams)": ["1st Year", "2nd Year"],
        "MA": ["1st Year", "2nd Year"],
        "Other": ["1st Year", "2nd Year"],
        "PG Diploma": ["1st Year", "2nd Year"],
        "MPH (Public Health)": ["1st Year", "2nd Year"],
        "LLM (Law PG)": ["1st Year", "2nd Year"]
      }
    }
  };

  const educationCategories = Object.keys(educationData);

  const currentData = educationData[educationcategory];
  const hassubcategories = currentData && currentData.subcategories;
  const subcategories = hassubcategories && currentData.subcategories ? (Array.isArray(currentData.subcategories) ? currentData.subcategories : Object.keys(currentData.subcategories)) : [];
  const years = hassubcategories && educationsubcategory && typeof currentData.subcategories === 'object' && currentData.subcategories[educationsubcategory] ? currentData.subcategories[educationsubcategory] : (currentData && currentData.years ? currentData.years : []);

  return (
    <div className="form-group">
      <label>
        <span className="field-label">Education Level<span className="required">*</span></span>
        <select
          name="educationcategory"
          value={educationcategory || ""}
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

      {educationcategory && hassubcategories && (
        <label style={{ marginTop: "12px" }}>
          <span className="field-label">Stream/Branch/Course<span className="required">*</span></span>
          <select
            name="educationsubcategory"
            value={educationsubcategory || ""}
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

      {educationcategory && (!hassubcategories || educationsubcategory) && (
        <label style={{ marginTop: "12px" }}>
          <span className="field-label">Year<span className="required">*</span></span>
          <select
            name="educationyear"
            value={educationyear || ""}
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
    </div>
  );
};

export default EducationDropdown;
