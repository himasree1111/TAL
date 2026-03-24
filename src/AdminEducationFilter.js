import React from "react";

const AdminEducationFilter = ({ educationcategory, educationsubcategory, educationyear, educationcategory_custom, educationsubcategory_custom, educationyear_custom, onChange }) => {
  const educationData = {
    "SCHOOL": {
      subcategories: null,
      years: ["8th Class", "9th Class", "10th Class", "Other"]
    },
    "INTERMEDIATE": {
      subcategories: ["MPC", "BiPC", "CEC", "MEC", "HEC", "Vocational", "Other"],
      years: ["11th", "12th", "Other"]
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
    "Other": {
      subcategories: ["Other"],
      years: ["Other"]
    }
  };

  const educationCategories = Object.keys(educationData);

  const currentData = educationData[educationcategory];
  const hassubcategories = currentData && currentData.subcategories;
  const subcategories = hassubcategories && currentData.subcategories ? (Array.isArray(currentData.subcategories) ? currentData.subcategories : Object.keys(currentData.subcategories)) : [];
  const years = hassubcategories && educationsubcategory && typeof currentData.subcategories === 'object' && currentData.subcategories[educationsubcategory] ? currentData.subcategories[educationsubcategory] : (currentData && currentData.years ? currentData.years : []);

  return (
    <div className="education-filter-group">
      <label>
        <span className="field-label">Education Level</span>
        <select
          name="educationcategory"
          value={educationcategory || ""}
          onChange={onChange}
        >
          <option value="">All Education Levels</option>
          {educationCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      {educationcategory && (
        <>
          {hassubcategories && (
            <label>
              <span className="field-label">Stream/Course</span>
              <select
                name="educationsubcategory"
                value={educationsubcategory || ""}
                onChange={onChange}
              >
                <option value="">All Streams</option>
                {subcategories.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </label>
          )}

          {(educationsubcategory || !hassubcategories) && (
            <label>
              <span className="field-label">Year/Class</span>
              <select
                name="educationyear"
                value={educationyear || ""}
                onChange={onChange}
              >
                <option value="">All Years</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          )}
        </>
      )}
    </div>
  );
};

export default AdminEducationFilter;

