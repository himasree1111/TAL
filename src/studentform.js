// import React, { useState } from "react";
// import "./StudentForm.css";

// export default function StudentForm() {
//   // State for form fields
//   const [formData, setFormData] = useState({
//     first_name: "",
//     last_name: "",
//     middle_name: "",
//     dob: "",
//     age: "",
//     pob: "",
//     nationality: "",
//     email: "",
//     contact: "",
//     whatsapp: "",
//     school: "",
//     branch: "",
//     prev_percent: "",
//     present_percent: "",
//     fee: "",
//     job: "",
//     aspiration: "",
//     scholarship: "",
//     certificates: "",
//     years_area: ""
//   });

//   // State for file uploads
//   const [files, setFiles] = useState({
//     school_id: null,
//     aadhaar: null,
//     income_proof: null,
//     marksheet: null,
//     passport_photo: null,
//     fees_receipt: null,
//     volunteer_signature: null,
//     student_signature: null,
//   });

//   const [bankAccount, setBankAccount] = useState("");

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//   };

//   const handleFileChange = (e, field) => {
//     const file = e.target.files[0];
//     if (file) {
//       setFiles({ ...files, [field]: file });
//     }
//   };

//   const allUploaded =
//     Object.values(files).every((f) => f !== null) && bankAccount.trim() !== "";

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim() || !formData.contact.trim()) {
//       alert("⚠️ Please fill in all mandatory fields: First Name, Last Name, Email, and Parent Number.");
//       return;
//     }
//     if (!allUploaded) {
//       alert("⚠️ Please upload all required documents before submitting.");
//       return;
//     }
//     alert("✅ Student details submitted successfully!");
//   };

//   const renderUploadField = (label, field) => (
//     <div className="upload-field">
//       <span className="label">{label}</span>
//       <div className="upload-controls">
//         <label className="upload-btn">
//           <span className="plus-icon">+</span>
//           <input
//             type="file"
//             style={{ display: "none" }}
//             onChange={(e) => handleFileChange(e, field)}
//           />
//         </label>
//         {files[field] && (
//           <span className="file-info">
//             <span className="tick">✓</span> {files[field].name}
//           </span>
//         )}
//       </div>
//     </div>
//   );

//   return (
//     <div className="form-container">
//       <h1 className="form-title">STUDENT APPLICATION FORM</h1>

//       <form onSubmit={handleSubmit}>
//         {/* Personal Data */}
//         <div className="section">
//           <h2>1. Personal Data</h2>
//           <div className="form-group">
//             <label>
//               <span className="field-label">First Name<span className="required">*</span></span>
//               <input
//                 type="text"
//                 name="first_name"
//                 value={formData.first_name}
//                 onChange={handleInputChange}
//                 required
//               />
//             </label>
//              <label>
//               Middle Name
//               <input 
//                 type="text" 
//                 name="middle_name" 
//                 value={formData.middle_name}
//                 onChange={handleInputChange}
//               />
//             </label>
//             <label>
//               <span className="field-label">Last Name<span className="required">*</span></span>
//               <input
//                 type="text"
//                 name="last_name"
//                 value={formData.last_name}
//                 onChange={handleInputChange}
//                 required
//               />
//             </label>
           
//           </div>

//           <div className="form-group">
//             <label>
//               Date of Birth
//               <input
//                 type="date"
//                 name="dob"
//                 value={formData.dob}
//                 onChange={handleInputChange}
//                 required
//               />
//             </label>
//             <label>
//               Age
//               <input
//                 type="number"
//                 name="age"
//                 value={formData.age}
//                 onChange={handleInputChange}
//               />
//             </label>
//             <label>
//               Place of Birth
//               <input
//                 type="text"
//                 name="pob"
//                 value={formData.pob}
//                 onChange={handleInputChange}
//               />
//             </label>
//             <label>
//               Address
//               <input
//                 type="text"
//                 name="address"
//                 value={formData.nationality}
//                 onChange={handleInputChange}
//               />
//             </label>
//           </div>

//           <div className="form-group">
//            <label>
//                 <span className="field-label">Parent Number<span className="required">*</span></span>
//                 <input
//                   type="text"
//                   name="contact"
//                   value={formData.contact}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </label>

//             <label>
//               Whatsapp Number
//               <input
//                 type="text"
//                 name="whatsapp"
//                 value={formData.whatsapp}
//                 onChange={handleInputChange}
//               />
//             </label>
//             <label>
//                Student Number
//               <input
//                 type="text"
//                 name="student_contact"
//                 value={formData.student_contact || ""}
//                 onChange={handleInputChange}
//               />
//             </label>
//             <label>
//               <span className="field-label">Email<span className="required">*</span></span>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleInputChange}
//                 required
//               />
//             </label>
//           </div>
//         </div>

//         {/* Academic Data */}
//         <div className="section">
//           <h2>2. Academic Details</h2>
//           <div className="form-group">
//             <label>
//               Name of School and college
//               <input 
//                 type="text" 
//                 name="school" 
//                 value={formData.school}
//                 onChange={handleInputChange}
//                 required
//               />
//             </label>
//             <label>
//               Which Branch
//               <input 
//                 type="text" 
//                 name="branch" 
//                 value={formData.branch}
//                 onChange={handleInputChange}
//               />
//             </label>
//           </div>

//           <div className="form-group">
//             <label>
//              Percentage scored in previous academic year
//               <input 
//                 type="text" 
//                 name="prev_percent" 
//                 value={formData.prev_percent}
//                 onChange={handleInputChange}
//               />
//             </label>
//             <label>
//               Percentage scored in present acedemic year
//               <input 
//                 type="text" 
//                 name="present_percent" 
//                 value={formData.present_percent}
//                 onChange={handleInputChange}
//               />
//             </label>
//           </div>
//         </div>

//         {/* Other Data */}
//         <div className="section">
//           <h2>3. Other Details</h2>
//           <div className="form-group">
//             <label>
//               Course / Class Fee
//               <input 
//                 type="text" 
//                 name="fee" 
//                 value={formData.fee}
//                 onChange={handleInputChange}
//               />
//             </label>
//             <label>
//              Does she work to support her family, If Yes what kind of job?
//               <input 
//                 type="text" 
//                 name="job" 
//                 value={formData.job}
//                 onChange={handleInputChange}
//               />
//             </label>
//           </div>

//           <div className="form-group">
//             <label>
// "What are her career aspirations and planned courses for the next two years?"
//               <input 
//                 type="text" 
//                 name="aspiration" 
//                 value={formData.aspiration}
//                 onChange={handleInputChange}
//               />
//             </label>
//             <label>
//               Is she currently getting any scholarship or Govt help or any financial assistance for her education or
// health

//               <input 
//                 type="text" 
//                 name="scholarship" 
//                 value={formData.scholarship}
//                 onChange={handleInputChange}
//               />
//             </label>
//           </div>

//           <div className="form-group">
//             <label>
//               Achievement Certificates
//               <input 
//                 type="text" 
//                 name="certificates" 
//                 value={formData.certificates}
//                 onChange={handleInputChange}
//               />
//             </label>
//             <label>
//                From how long they living in this Area. Is she temporary living (migrant worker)?
//               <input 
//                 type="text" 
//                 name="years_area" 
//                 value={formData.years_area}
//                 onChange={handleInputChange}
//               />
//             </label>
//           </div>
//         </div>
        
//         {/* Document Upload Section */}
//         <div className="section">
//           <h2>4. Document Upload</h2>
          
//           {renderUploadField("School / College ID", "school_id")}
//           {renderUploadField("Aadhaar Card", "aadhaar")}
//           {renderUploadField("Income Proof", "income_proof")}
//           {renderUploadField("Marks Sheet (Last & Present Year)", "marksheet")}
//           {renderUploadField("Passport Size Photo", "passport_photo")}

//           <div className="upload-field">
//             <span className="label">Bank Account Details</span>
//             <input
//               type="text"
//               placeholder="Enter bank account details"
//               value={bankAccount}
//               onChange={(e) => setBankAccount(e.target.value)}
//               required
//             />
//           </div>

//           {renderUploadField("Fees Receipt (Upload / Text)", "fees_receipt")}
//           {renderUploadField("Volunteer Signature", "volunteer_signature")}
//           {renderUploadField("Student Signature", "student_signature")}
//         </div>
   
//         {/* Submit */}
//         <div className="submit-container">
//           <button type="submit" disabled={!allUploaded}>
//             Submit Application
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// import React, { useState } from "react";
// import "./StudentForm.css";

// export default function StudentForm() {
//   // State for form fields
//   const [formData, setFormData] = useState({
//     first_name: "",
//     last_name: "",
//     middle_name: "",
//     dob: "",
//     age: "",
//     pob: "",
//     nationality: "",
//     email: "",
//     contact: "",
//     whatsapp: "",
//     school: "",
//     branch: "",
//     prev_percent: "",
//     present_percent: "",
//     fee: "",
//     job: "",
//     aspiration: "",
//     scholarship: "",
//     certificates: "",
//     years_area: "",
//     parents_full_names: "",
//     earning_members: ""
//   });

//   // State for file uploads
//   const [files, setFiles] = useState({
//     school_id: null,
//     aadhaar: null,
//     income_proof: null,
//     marksheet: null,
//     passport_photo: null,
//     fees_receipt: null,
//     volunteer_signature: null,
//     student_signature: null,
//   });

//   const [bankAccount, setBankAccount] = useState("");

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//   };

//   const handleFileChange = (e, field) => {
//     const file = e.target.files[0];
//     if (file) {
//       setFiles({ ...files, [field]: file });
//     }
//   };

//   const allUploaded =
//     Object.values(files).every((f) => f !== null) && bankAccount.trim() !== "";

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim() || !formData.contact.trim()) {
//       alert("⚠️ Please fill in all mandatory fields: First Name, Last Name, Email, and Parent Number.");
//       return;
//     }
//     if (!allUploaded) {
//       alert("⚠️ Please upload all required documents before submitting.");
//       return;
//     }
//     alert("✅ Student details submitted successfully!");
//   };

//   const renderUploadField = (label, field) => (
//     <div className="upload-field">
//       <span className="label">{label}</span>
//       <div className="upload-controls">
//         <label className="upload-btn">
//           <span className="plus-icon">+</span>
//           <input
//             type="file"
//             style={{ display: "none" }}
//             onChange={(e) => handleFileChange(e, field)}
//           />
//         </label>
//         {files[field] && (
//           <span className="file-info">
//             <span className="tick">✓</span> {files[field].name}
//           </span>
//         )}
//       </div>
//     </div>
//   );

//   return (
//     <div className="form-container">
//       <h1 className="form-title">STUDENT APPLICATION FORM</h1>

//       <form onSubmit={handleSubmit}>
//         {/* Personal Data */}
//         <div className="section">
//           <h2>1. Personal Data</h2>
//           <div className="form-group">
//             <label>
//               <span className="field-label">First Name<span className="required">*</span></span>
//               <input
//                 type="text"
//                 name="first_name"
//                 value={formData.first_name}
//                 onChange={handleInputChange}
//                 required
//               />
//             </label>
//              <label>
//               Middle Name
//               <input 
//                 type="text" 
//                 name="middle_name" 
//                 value={formData.middle_name}
//                 onChange={handleInputChange}
//               />
//             </label>
//             <label>
//               <span className="field-label">Last Name<span className="required">*</span></span>
//               <input
//                 type="text"
//                 name="last_name"
//                 value={formData.last_name}
//                 onChange={handleInputChange}
//                 required
//               />
//             </label>
//           </div>

//           {/* New fields requested: Parents Full Names & Earning members */}
//           <div className="form-group">
//             <label>
//               <span className="field-label">Parents Full Names<span className="required">*</span></span>
//               <input
//                 type="text"
//                 name="parents_full_names"
//                 value={formData.parents_full_names}
//                 onChange={handleInputChange}
//                 placeholder="e.g. Father: John Doe; Mother: Jane Doe"
//               />
//             </label>

//             <label>
//               <span className="field-label">Who all are the earning members of the family and what do they do?<span className="required">*</span></span>
//               <input
//                 type="text"
//                 name="earning_members"
//                 value={formData.earning_members}
//                 onChange={handleInputChange}
//                 placeholder="e.g. Father - Tailor; Mother - Homemaker; Uncle - Driver"
//               />
//             </label>
//           </div>

//           <div className="form-group">
//             <label>
//               Date of Birth
//               <input
//                 type="date"
//                 name="dob"
//                 value={formData.dob}
//                 onChange={handleInputChange}
//                 required
//               />
//             </label>
//             <label>
//               Age
//               <input
//                 type="number"
//                 name="age"
//                 value={formData.age}
//                 onChange={handleInputChange}
//               />
//             </label>
//             <label>
//               Place of Birth
//               <input
//                 type="text"
//                 name="pob"
//                 value={formData.pob}
//                 onChange={handleInputChange}
//               />
//             </label>
//             <label>
//               Address
//               <input
//                 type="text"
//                 name="address"
//                 value={formData.nationality}
//                 onChange={handleInputChange}
//               />
//             </label>
//           </div>

//           <div className="form-group">
//            <label>
//                 <span className="field-label">Parent Number<span className="required">*</span></span>
//                 <input
//                   type="text"
//                   name="contact"
//                   value={formData.contact}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </label>

//             <label>
//               Whatsapp Number
//               <input
//                 type="text"
//                 name="whatsapp"
//                 value={formData.whatsapp}
//                 onChange={handleInputChange}
//               />
//             </label>
//             <label>
//                Student Number
//               <input
//                 type="text"
//                 name="student_contact"
//                 value={formData.student_contact || ""}
//                 onChange={handleInputChange}
//               />
//             </label>
//             <label>
//               <span className="field-label">Email<span className="required">*</span></span>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleInputChange}
//                 required
//               />
//             </label>
//           </div>
//         </div>

//         {/* Academic Data */}
//         <div className="section">
//           <h2>2. Academic Details</h2>
//           <div className="form-group">
//             <label>
//               Name of School and college
//               <input 
//                 type="text" 
//                 name="school" 
//                 value={formData.school}
//                 onChange={handleInputChange}
//                 required
//               />
//             </label>
//             <label>
//               Which Branch
//               <input 
//                 type="text" 
//                 name="branch" 
//                 value={formData.branch}
//                 onChange={handleInputChange}
//               />
//             </label>
//           </div>

//           <div className="form-group">
//             <label>
//              Percentage scored in previous academic year
//               <input 
//                 type="text" 
//                 name="prev_percent" 
//                 value={formData.prev_percent}
//                 onChange={handleInputChange}
//               />
//             </label>
//             <label>
//               Percentage scored in present acedemic year
//               <input 
//                 type="text" 
//                 name="present_percent" 
//                 value={formData.present_percent}
//                 onChange={handleInputChange}
//               />
//             </label>
//           </div>
//         </div>

//         {/* Other Data */}
//         <div className="section">
//           <h2>3. Other Details</h2>
//           <div className="form-group">
//             <label>
//               Course / Class Fee
//               <input 
//                 type="text" 
//                 name="fee" 
//                 value={formData.fee}
//                 onChange={handleInputChange}
//               />
//             </label>
//             <label>
//              Does she work to support her family, If Yes what kind of job?
//               <input 
//                 type="text" 
//                 name="job" 
//                 value={formData.job}
//                 onChange={handleInputChange}
//               />
//             </label>
//           </div>

//           <div className="form-group">
//             <label>
// "What are her career aspirations and planned courses for the next two years?"
//               <input 
//                 type="text" 
//                 name="aspiration" 
//                 value={formData.aspiration}
//                 onChange={handleInputChange}
//               />
//             </label>
//             <label>
//               Is she currently getting any scholarship or Govt help or any financial assistance for her education or
// health

//               <input 
//                 type="text" 
//                 name="scholarship" 
//                 value={formData.scholarship}
//                 onChange={handleInputChange}
//               />
//             </label>
//           </div>

//           <div className="form-group">
//             <label>
//               Achievement Certificates
//               <input 
//                 type="text" 
//                 name="certificates" 
//                 value={formData.certificates}
//                 onChange={handleInputChange}
//               />
//             </label>
//             <label>
//                From how long they living in this Area. Is she temporary living (migrant worker)?
//               <input 
//                 type="text" 
//                 name="years_area" 
//                 value={formData.years_area}
//                 onChange={handleInputChange}
//               />
//             </label>
//           </div>
//         </div>
        
//         {/* Document Upload Section */}
//         <div className="section">
//           <h2>4. Document Upload</h2>
          
//           {renderUploadField("School / College ID", "school_id")}
//           {renderUploadField("Aadhaar Card", "aadhaar")}
//           {renderUploadField("Income Proof", "income_proof")}
//           {renderUploadField("Marks Sheet (Last & Present Year)", "marksheet")}
//           {renderUploadField("Passport Size Photo", "passport_photo")}

//           <div className="upload-field">
//             <span className="label">Bank Account Details</span>
//             <input
//               type="text"
//               placeholder="Enter bank account details"
//               value={bankAccount}
//               onChange={(e) => setBankAccount(e.target.value)}
//               required
//             />
//           </div>

//           {renderUploadField("Fees Receipt (Upload / Text)", "fees_receipt")}
//           {renderUploadField("Volunteer Signature", "volunteer_signature")}
//           {renderUploadField("Student Signature", "student_signature")}
//         </div>
   
//         {/* Submit */}
//         <div className="submit-container">
//           <button type="submit" disabled={!allUploaded}>
//             Submit Application
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }

// import React, { useState, useEffect } from "react";
// import "./StudentForm.css";
// import demoVolunteer from "./volunteer.json";
// import { useRef } from "react";

// function VolunteerProfile({ volunteer, onLogin, onLogout }) {
//   const [open, setOpen] = useState(false);
//   const btnRef = useRef();

//   const avatarSrc =
//     (volunteer && volunteer.avatar && volunteer.avatar.trim()) ||
//     demoVolunteer.avatar ||
//     `https://ui-avatars.com/api/?name=${encodeURIComponent(
//       (volunteer && volunteer.name) || demoVolunteer.name || "Volunteer"
//     )}&background=0D8ABC&color=fff`;

//   useEffect(() => {
//     function onDocClick(e) {
//       if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
//     }
//     document.addEventListener("click", onDocClick);
//     return () => document.removeEventListener("click", onDocClick);
//   }, []);

//   return (
//     <div className="volunteer-profile" ref={btnRef}>
//       <button
//         type="button"
//         className="volunteer-btn"
//         aria-expanded={open}
//         onClick={() => setOpen((s) => !s)}
//       >
//         <img className="volunteer-avatar" src={avatarSrc} alt="volunteer avatar" />
//       </button>

//       {open && (
//         <div className="volunteer-dropdown" role="dialog" aria-label="Volunteer menu">
//           {volunteer ? (
//             <>
//               <div className="volunteer-info">
//                 <div className="vd-row">
//                   <img className="vd-avatar" src={avatarSrc} alt="avatar small" />
//                   <div className="vd-meta">
//                     <strong>{volunteer.name}</strong>
//                     <div className="volunteer-role">{volunteer.role || "Volunteer"}</div>
//                     <div className="volunteer-email">{volunteer.email}</div>
//                   </div>
//                 </div>
//               </div>

//               <div className="volunteer-actions">
//                 <button
//                   type="button"
//                   className="btn-logout"
//                   onClick={() => {
//                     setOpen(false);
//                     onLogout();
//                   }}
//                 >
//                   Logout
//                 </button>
//               </div>
//             </>
//           ) : (
//             <>
//               <div className="volunteer-info">
//                 <strong>Not logged in</strong>
//                 <div className="volunteer-email">Click below to login (demo)</div>
//               </div>
//               <div className="volunteer-actions">
//                 <button
//                   type="button"
//                   className="btn-login"
//                   onClick={() => {
//                     onLogin();
//                     setOpen(false);
//                   }}
//                 >
//                   Login (Demo)
//                 </button>
//               </div>
//             </>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// export default function StudentForm() {
//   // State for form fields
//   const [formData, setFormData] = useState({
//     first_name: "",
//     last_name: "",
//     middle_name: "",
//     dob: "",
//     age: "",
//     pob: "",
//     nationality: "",
//     email: "",
//     contact: "",
//     whatsapp: "",
//     school: "",
//     branch: "",
//     prev_percent: "",
//     present_percent: "",
//     fee: "",
//     job: "",
//     aspiration: "",
//     scholarship: "",
//     certificates: "",
//     years_area: "",
//     parents_full_names: "",
//     earning_members: ""
//   });

//   // State for file uploads
//   const [files, setFiles] = useState({
//     school_id: null,
//     aadhaar: null,
//     income_proof: null,
//     marksheet: null,
//     passport_photo: null,
//     fees_receipt: null,
//     volunteer_signature: null,
//     student_signature: null,
//   });

//   const [bankAccount, setBankAccount] = useState("");

//   // Volunteer state: read from localStorage so profile remains until logout
//   const [volunteer, setVolunteer] = useState(null);

//   useEffect(() => {
//     try {
//       const v = JSON.parse(localStorage.getItem("volunteerProfile"));
//       if (v && v.name) setVolunteer(v);
//     } catch (e) {
//       // ignore
//     }
//   }, []);

//   const loginMockVolunteer = () => {
//     // use JSON file content for demo login
//     localStorage.setItem("volunteerProfile", JSON.stringify(demoVolunteer));
//     setVolunteer(demoVolunteer);
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("volunteerProfile");
//     setVolunteer(null);
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//   };

//   const handleFileChange = (e, field) => {
//     const file = e.target.files[0];
//     if (file) {
//       setFiles({ ...files, [field]: file });
//     }
//   };

//   const allUploaded =
//     Object.values(files).every((f) => f !== null) && bankAccount.trim() !== "";

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim() || !formData.contact.trim()) {
//       alert("⚠️ Please fill in all mandatory fields: First Name, Last Name, Email, and Parent Number.");
//       return;
//     }
//     if (!allUploaded) {
//       alert("⚠️ Please upload all required documents before submitting.");
//       return;
//     }
//     alert("✅ Student details submitted successfully!");
//   };

//   const renderUploadField = (label, field) => (
//     <div className="upload-field">
//       <span className="label">{label}</span>
//       <div className="upload-controls">
//         <label className="upload-btn">
//           <span className="plus-icon">+</span>
//           <input
//             type="file"
//             style={{ display: "none" }}
//             onChange={(e) => handleFileChange(e, field)}
//           />
//         </label>
//         {files[field] && (
//           <span className="file-info">
//             <span className="tick">✓</span> {files[field].name}
//           </span>
//         )}
//       </div>
//     </div>
//   );

//   return (
//     <div className="form-page-wrapper">
//       {/* Top bar with volunteer profile (right) */}
//       <div className="topbar">
//         <div className="left-top"> {/* You can add breadcrumbs or title here */} </div>

//         <div className="right-top">
//           <VolunteerProfile
//             volunteer={volunteer}
//             onLogin={loginMockVolunteer}
//             onLogout={handleLogout}
//           />
//         </div>
//       </div>

//       <div className="form-container">
//         <h1 className="form-title">STUDENT APPLICATION FORM</h1>

//         <form onSubmit={handleSubmit}>
//           {/* Personal Data */}
//           <div className="section">
//             <h2>1. Personal Data</h2>
//             <div className="form-group">
//               <label>
//                 <span className="field-label">First Name<span className="required">*</span></span>
//                 <input
//                   type="text"
//                   name="first_name"
//                   value={formData.first_name}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </label>
//                <label>
//                 Middle Name
//                 <input 
//                   type="text" 
//                   name="middle_name" 
//                   value={formData.middle_name}
//                   onChange={handleInputChange}
//                 />
//               </label>
//               <label>
//                 <span className="field-label">Last Name<span className="required">*</span></span>
//                 <input
//                   type="text"
//                   name="last_name"
//                   value={formData.last_name}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </label>
//             </div>

//             {/* New fields requested: Parents Full Names & Earning members */}
//             <div className="form-group">
//               <label>
//                 <span className="field-label">Parents Full Names<span className="required">*</span></span>
//                 <input
//                   type="text"
//                   name="parents_full_names"
//                   value={formData.parents_full_names}
//                   onChange={handleInputChange}
//                   placeholder="e.g. Father: John Doe; Mother: Jane Doe"
//                 />
//               </label>

//               <label>
//                 <span className="field-label">Who all are the earning members of the family and what do they do?<span className="required">*</span></span>
//                 <input
//                   type="text"
//                   name="earning_members"
//                   value={formData.earning_members}
//                   onChange={handleInputChange}
//                   placeholder="e.g. Father - Tailor; Mother - Homemaker; Uncle - Driver"
//                 />
//               </label>
//             </div>

//             <div className="form-group">
//               <label>
//                 Date of Birth
//                 <input
//                   type="date"
//                   name="dob"
//                   value={formData.dob}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </label>
//               <label>
//                 Age
//                 <input
//                   type="number"
//                   name="age"
//                   value={formData.age}
//                   onChange={handleInputChange}
//                 />
//               </label>
//               <label>
//                 Place of Birth
//                 <input
//                   type="text"
//                   name="pob"
//                   value={formData.pob}
//                   onChange={handleInputChange}
//                 />
//               </label>
//               <label>
//                 Address
//                 <input
//                   type="text"
//                   name="address"
//                   value={formData.nationality}
//                   onChange={handleInputChange}
//                 />
//               </label>
//             </div>

//             <div className="form-group">
//              <label>
//                   <span className="field-label">Parent Number<span className="required">*</span></span>
//                   <input
//                     type="text"
//                     name="contact"
//                     value={formData.contact}
//                     onChange={handleInputChange}
//                     required
//                   />
//                 </label>

//               <label>
//                 Whatsapp Number
//                 <input
//                   type="text"
//                   name="whatsapp"
//                   value={formData.whatsapp}
//                   onChange={handleInputChange}
//                 />
//               </label>
//               <label>
//                  Student Number
//                 <input
//                   type="text"
//                   name="student_contact"
//                   value={formData.student_contact || ""}
//                   onChange={handleInputChange}
//                 />
//               </label>
//               <label>
//                 <span className="field-label">Email<span className="required">*</span></span>
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </label>
//             </div>
//           </div>

//           {/* Academic Data */}
//           <div className="section">
//             <h2>2. Academic Details</h2>
//             <div className="form-group">
//               <label>
//                 Name of School and college
//                 <input 
//                   type="text" 
//                   name="school" 
//                   value={formData.school}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </label>
//               <label>
//                 Which Branch
//                 <input 
//                   type="text" 
//                   name="branch" 
//                   value={formData.branch}
//                   onChange={handleInputChange}
//                 />
//               </label>
//             </div>

//             <div className="form-group">
//               <label>
//                Percentage scored in previous academic year
//                 <input 
//                   type="text" 
//                   name="prev_percent" 
//                   value={formData.prev_percent}
//                   onChange={handleInputChange}
//                 />
//               </label>
//               <label>
//                 Percentage scored in present acedemic year
//                 <input 
//                   type="text" 
//                   name="present_percent" 
//                   value={formData.present_percent}
//                   onChange={handleInputChange}
//                 />
//               </label>
//             </div>
//           </div>

//           {/* Other Data */}
//           <div className="section">
//             <h2>3. Other Details</h2>
//             <div className="form-group">
//               <label>
//                 Course / Class Fee
//                 <input 
//                   type="text" 
//                   name="fee" 
//                   value={formData.fee}
//                   onChange={handleInputChange}
//                 />
//               </label>
//               <label>
//                Does she work to support her family, If Yes what kind of job?
//                 <input 
//                   type="text" 
//                   name="job" 
//                   value={formData.job}
//                   onChange={handleInputChange}
//                 />
//               </label>
//             </div>

//             <div className="form-group">
//               <label>
//   "What are her career aspirations and planned courses for the next two years?"
//                 <input 
//                   type="text" 
//                   name="aspiration" 
//                   value={formData.aspiration}
//                   onChange={handleInputChange}
//                 />
//               </label>
//               <label>
//                 Is she currently getting any scholarship or Govt help or any financial assistance for her education or
//   health

//                 <input 
//                   type="text" 
//                   name="scholarship" 
//                   value={formData.scholarship}
//                   onChange={handleInputChange}
//                 />
//               </label>
//             </div>

//             <div className="form-group">
//               <label>
//                 Achievement Certificates
//                 <input 
//                   type="text" 
//                   name="certificates" 
//                   value={formData.certificates}
//                   onChange={handleInputChange}
//                 />
//               </label>
//               <label>
//                  From how long they living in this Area. Is she temporary living (migrant worker)?
//                 <input 
//                   type="text" 
//                   name="years_area" 
//                   value={formData.years_area}
//                   onChange={handleInputChange}
//                 />
//               </label>
//             </div>
//           </div>
          
//           {/* Document Upload Section */}
//           <div className="section">
//             <h2>4. Document Upload</h2>
            
//             {renderUploadField("School / College ID", "school_id")}
//             {renderUploadField("Aadhaar Card", "aadhaar")}
//             {renderUploadField("Income Proof", "income_proof")}
//             {renderUploadField("Marks Sheet (Last & Present Year)", "marksheet")}
//             {renderUploadField("Passport Size Photo", "passport_photo")}

//             <div className="upload-field">
//               <span className="label">Bank Account Details</span>
//               <input
//                 type="text"
//                 placeholder="Enter bank account details"
//                 value={bankAccount}
//                 onChange={(e) => setBankAccount(e.target.value)}
//                 required
//               />
//             </div>

//             {renderUploadField("Fees Receipt (Upload / Text)", "fees_receipt")}
//             {renderUploadField("Volunteer Signature", "volunteer_signature")}
//             {renderUploadField("Student Signature", "student_signature")}
//           </div>
     
//           {/* Submit */}
//           <div className="submit-container">
//             <button type="submit" disabled={!allUploaded}>
//               Submit Application
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// import React, { useState, useEffect, useRef } from "react";
// // Import useNavigate from react-router-dom
// import { useNavigate } from "react-router-dom";
// import "./StudentForm.css";
// import demoVolunteer from "./volunteer.json";

// function VolunteerProfile({ volunteer, onLogin, onLogout }) {
//   const [open, setOpen] = useState(false);
//   const btnRef = useRef();

//   const avatarSrc =
//     (volunteer && volunteer.avatar && volunteer.avatar.trim()) ||
//     demoVolunteer.avatar ||
//     `https://ui-avatars.com/api/?name=${encodeURIComponent(
//       (volunteer && volunteer.name) || demoVolunteer.name || "Volunteer"
//     )}&background=0D8ABC&color=fff`;

//   useEffect(() => {
//     function onDocClick(e) {
//       if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
//     }
//     document.addEventListener("click", onDocClick);
//     return () => document.removeEventListener("click", onDocClick);
//   }, []);

//   return (
//     <div className="volunteer-profile" ref={btnRef}>
//       <button
//         type="button"
//         className="volunteer-btn"
//         aria-expanded={open}
//         onClick={() => setOpen((s) => !s)}
//       >
//         <img className="volunteer-avatar" src={avatarSrc} alt="volunteer avatar" />
//       </button>

//       {open && (
//         <div className="volunteer-dropdown" role="dialog" aria-label="Volunteer menu">
//           {volunteer ? (
//             <>
//               <div className="volunteer-info">
//                 <div className="vd-row">
//                   <img className="vd-avatar" src={avatarSrc} alt="avatar small" />
//                   <div className="vd-meta">
//                     <strong>{volunteer.name}</strong>
//                     <div className="volunteer-role">{volunteer.role || "Volunteer"}</div>
//                     <div className="volunteer-email">{volunteer.email}</div>
//                   </div>
//                 </div>
//               </div>

//               <div className="volunteer-actions">
//                 <button
//                   type="button"
//                   className="btn-logout"
//                   onClick={() => {
//                     setOpen(false);
//                     onLogout();
//                   }}
//                 >
//                   Logout
//                 </button>
//               </div>
//             </>
//           ) : (
//             <>
//               <div className="volunteer-info">
//                 <strong>Not logged in</strong>
//                 <div className="volunteer-email">Click below to login (demo)</div>
//               </div>
//               <div className="volunteer-actions">
//                 <button
//                   type="button"
//                   className="btn-login"
//                   onClick={() => {
//                     onLogin();
//                     setOpen(false);
//                   }}
//                 >
//                   Login (Demo)
//                 </button>
//               </div>
//             </>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// export default function StudentForm() {
//   // Initialize the navigate function
//   const navigate = useNavigate();

//   // State for form fields
//   const [formData, setFormData] = useState({
//     first_name: "",
//     last_name: "",
//     middle_name: "",
//     dob: "",
//     age: "",
//     pob: "",
//     nationality: "",
//     email: "",
//     contact: "",
//     whatsapp: "",
//     school: "",
//     branch: "",
//     prev_percent: "",
//     present_percent: "",
//     fee: "",
//     job: "",
//     aspiration: "",
//     scholarship: "",
//     certificates: "",
//     years_area: "",
//     parents_full_names: "",
//     earning_members: ""
//   });

//   // State for file uploads
//   const [files, setFiles] = useState({
//     school_id: null,
//     aadhaar: null,
//     income_proof: null,
//     marksheet: null,
//     passport_photo: null,
//     fees_receipt: null,
//     volunteer_signature: null,
//     student_signature: null,
//   });

//   const [bankAccount, setBankAccount] = useState("");

//   // Volunteer state: read from localStorage so profile remains until logout
//   const [volunteer, setVolunteer] = useState(null);

//   useEffect(() => {
//     try {
//       const v = JSON.parse(localStorage.getItem("volunteerProfile"));
//       if (v && v.name) setVolunteer(v);
//     } catch (e) {
//       // ignore
//     }
//   }, []);

//   const loginMockVolunteer = () => {
//     // use JSON file content for demo login
//     localStorage.setItem("volunteerProfile", JSON.stringify(demoVolunteer));
//     setVolunteer(demoVolunteer);
//   };

//   const handleLogout = () => {
//     localStorage.removeItem("volunteerProfile");
//     setVolunteer(null);
//     // Navigate to the profiles page on logout
//     navigate('/login');
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//   };

//   const handleFileChange = (e, field) => {
//     const file = e.target.files[0];
//     if (file) {
//       setFiles({ ...files, [field]: file });
//     }
//   };

//   const allUploaded =
//     Object.values(files).every((f) => f !== null) && bankAccount.trim() !== "";

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim() || !formData.contact.trim()) {
//       alert("⚠️ Please fill in all mandatory fields: First Name, Last Name, Email, and Parent Number.");
//       return;
//     }
//     if (!allUploaded) {
//       alert("⚠️ Please upload all required documents before submitting.");
//       return;
//     }
//     alert("✅ Student details submitted successfully!");
//   };

//   const renderUploadField = (label, field) => (
//     <div className="upload-field">
//       <span className="label">{label}</span>
//       <div className="upload-controls">
//         <label className="upload-btn">
//           <span className="plus-icon">+</span>
//           <input
//             type="file"
//             style={{ display: "none" }}
//             onChange={(e) => handleFileChange(e, field)}
//           />
//         </label>
//         {files[field] && (
//           <span className="file-info">
//             <span className="tick">✓</span> {files[field].name}
//           </span>
//         )}
//       </div>
//     </div>
//   );

//   return (
//     <div className="form-page-wrapper">
//       {/* Top bar with volunteer profile (right) */}
//       <div className="topbar">
//         <div className="left-top"> {/* You can add breadcrumbs or title here */} </div>

//         <div className="right-top">
//           <VolunteerProfile
//             volunteer={volunteer}
//             onLogin={loginMockVolunteer}
//             onLogout={handleLogout}
//           />
//         </div>
//       </div>

//       <div className="form-container">
//         <h1 className="form-title">STUDENT APPLICATION FORM</h1>

//         <form onSubmit={handleSubmit}>
//           {/* Personal Data */}
//           <div className="section">
//             <h2>1. Personal Data</h2>
//             <div className="form-group">
//               <label>
//                 <span className="field-label">First Name<span className="required">*</span></span>
//                 <input
//                   type="text"
//                   name="first_name"
//                   value={formData.first_name}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </label>
//               <label>
//                 Middle Name
//                 <input
//                   type="text"
//                   name="middle_name"
//                   value={formData.middle_name}
//                   onChange={handleInputChange}
//                 />
//               </label>
//               <label>
//                 <span className="field-label">Last Name<span className="required">*</span></span>
//                 <input
//                   type="text"
//                   name="last_name"
//                   value={formData.last_name}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </label>
//             </div>

//             {/* New fields requested: Parents Full Names & Earning members */}
//             <div className="form-group">
//               <label>
//                 <span className="field-label">Parents Full Names<span className="required">*</span></span>
//                 <input
//                   type="text"
//                   name="parents_full_names"
//                   value={formData.parents_full_names}
//                   onChange={handleInputChange}
//                   placeholder="e.g. Father: John Doe; Mother: Jane Doe"
//                 />
//               </label>

//               <label>
//                 <span className="field-label">Who all are the earning members of the family and what do they do?<span className="required">*</span></span>
//                 <input
//                   type="text"
//                   name="earning_members"
//                   value={formData.earning_members}
//                   onChange={handleInputChange}
//                   placeholder="e.g. Father - Tailor; Mother - Homemaker; Uncle - Driver"
//                 />
//               </label>
//             </div>

//             <div className="form-group">
//               <label>
//                 Date of Birth
//                 <input
//                   type="date"
//                   name="dob"
//                   value={formData.dob}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </label>
//               <label>
//                 Age
//                 <input
//                   type="number"
//                   name="age"
//                   value={formData.age}
//                   onChange={handleInputChange}
//                 />
//               </label>
//               <label>
//                 Place of Birth
//                 <input
//                   type="text"
//                   name="pob"
//                   value={formData.pob}
//                   onChange={handleInputChange}
//                 />
//               </label>
//               <label>
//                 Address
//                 <input
//                   type="text"
//                   name="address"
//                   value={formData.nationality}
//                   onChange={handleInputChange}
//                 />
//               </label>
//             </div>

//             <div className="form-group">
//               <label>
//                 <span className="field-label">Parent Number<span className="required">*</span></span>
//                 <input
//                   type="text"
//                   name="contact"
//                   value={formData.contact}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </label>

//               <label>
//                 Whatsapp Number
//                 <input
//                   type="text"
//                   name="whatsapp"
//                   value={formData.whatsapp}
//                   onChange={handleInputChange}
//                 />
//               </label>
//               <label>
//                 Student Number
//                 <input
//                   type="text"
//                   name="student_contact"
//                   value={formData.student_contact || ""}
//                   onChange={handleInputChange}
//                 />
//               </label>
//               <label>
//                 <span className="field-label">Email<span className="required">*</span></span>
//                 <input
//                   type="email"
//                   name="email"
//                   value={formData.email}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </label>
//             </div>
//           </div>

//           {/* Academic Data */}
//           <div className="section">
//             <h2>2. Academic Details</h2>
//             <div className="form-group">
//               <label>
//                 Name of School and college
//                 <input
//                   type="text"
//                   name="school"
//                   value={formData.school}
//                   onChange={handleInputChange}
//                   required
//                 />
//               </label>
//               <label>
//                 Which Branch
//                 <input
//                   type="text"
//                   name="branch"
//                   value={formData.branch}
//                   onChange={handleInputChange}
//                 />
//               </label>
//             </div>

//             <div className="form-group">
//               <label>
//                 Percentage scored in previous academic year
//                 <input
//                   type="text"
//                   name="prev_percent"
//                   value={formData.prev_percent}
//                   onChange={handleInputChange}
//                 />
//               </label>
//               <label>
//                 Percentage scored in present acedemic year
//                 <input
//                   type="text"
//                   name="present_percent"
//                   value={formData.present_percent}
//                   onChange={handleInputChange}
//                 />
//               </label>
//             </div>
//           </div>

//           {/* Other Data */}
//           <div className="section">
//             <h2>3. Other Details</h2>
//             <div className="form-group">
//               <label>
//                 Course / Class Fee
//                 <input
//                   type="text"
//                   name="fee"
//                   value={formData.fee}
//                   onChange={handleInputChange}
//                 />
//               </label>
//               <label>
//                 Does she work to support her family, If Yes what kind of job?
//                 <input
//                   type="text"
//                   name="job"
//                   value={formData.job}
//                   onChange={handleInputChange}
//                 />
//               </label>
//             </div>

//             <div className="form-group">
//               <label>
//                 "What are her career aspirations and planned courses for the next two years?"
//                 <input
//                   type="text"
//                   name="aspiration"
//                   value={formData.aspiration}
//                   onChange={handleInputChange}
//                 />
//               </label>
//               <label>
//                 Is she currently getting any scholarship or Govt help or any financial assistance for her education or
//                 health

//                 <input
//                   type="text"
//                   name="scholarship"
//                   value={formData.scholarship}
//                   onChange={handleInputChange}
//                 />
//               </label>
//             </div>

//             <div className="form-group">
//               <label>
//                 Achievement Certificates
//                 <input
//                   type="text"
//                   name="certificates"
//                   value={formData.certificates}
//                   onChange={handleInputChange}
//                 />
//               </label>
//               <label>
//                 From how long they living in this Area. Is she temporary living (migrant worker)?
//                 <input
//                   type="text"
//                   name="years_area"
//                   value={formData.years_area}
//                   onChange={handleInputChange}
//                 />
//               </label>
//             </div>
//           </div>

//           {/* Document Upload Section */}
//           <div className="section">
//             <h2>4. Document Upload</h2>

//             {renderUploadField("School / College ID", "school_id")}
//             {renderUploadField("Aadhaar Card", "aadhaar")}
//             {renderUploadField("Income Proof", "income_proof")}
//             {renderUploadField("Marks Sheet (Last & Present Year)", "marksheet")}
//             {renderUploadField("Passport Size Photo", "passport_photo")}

//             <div className="upload-field">
//               <span className="label">Bank Account Details</span>
//               <input
//                 type="text"
//                 placeholder="Enter bank account details"
//                 value={bankAccount}
//                 onChange={(e) => setBankAccount(e.target.value)}
//                 required
//               />
//             </div>

//             {renderUploadField("Fees Receipt (Upload / Text)", "fees_receipt")}
//             {renderUploadField("Volunteer Signature", "volunteer_signature")}
//             {renderUploadField("Student Signature", "student_signature")}
//           </div>

//           {/* Submit */}
//           <div className="submit-container">
//             <button type="submit" disabled={!allUploaded}>
//               Submit Application
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentForm.css";

// This component displays the logged-in volunteer's profile.
function VolunteerProfile({ volunteer, onLogout }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef();

  // This hook must be called at the top level, before any conditional returns.
  useEffect(() => {
    const onDocClick = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // If no volunteer is logged in, we render nothing.
  if (!volunteer) {
    return null;
  }

  const avatarSrc =
    (volunteer.avatar && volunteer.avatar.trim()) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      volunteer.name || "Volunteer"
    )}&background=0D8ABC&color=fff`;

  return (
    <div className="volunteer-profile" ref={btnRef}>
      <button
        type="button"
        className="volunteer-btn"
        aria-expanded={open}
        onClick={() => setOpen((s) => !s)}
      >
        <img className="volunteer-avatar" src={avatarSrc} alt="volunteer avatar" />
      </button>

      {open && (
        <div className="volunteer-dropdown" role="dialog" aria-label="Volunteer menu">
          <div className="volunteer-info">
            <div className="vd-row">
              <img className="vd-avatar" src={avatarSrc} alt="avatar small" />
              <div className="vd-meta">
                <strong>{volunteer.name}</strong>
                <div className="volunteer-role">{volunteer.role || "Volunteer"}</div>
                <div className="volunteer-email">{volunteer.email}</div>
              </div>
            </div>
          </div>
          <div className="volunteer-actions">
            <button
              type="button"
              className="btn-logout"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// This is the main form component.
export default function StudentForm() {
  const navigate = useNavigate();

  // State for all form text fields
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
    student_contact: "",
    school: "",
    branch: "",
    prev_percent: "",
    present_percent: "",
    fee: "",
    job: "",
    aspiration: "",
    scholarship: "",
    certificates: "",
    years_area: "",

    parents_full_names: "",
    earning_members: "",
=======
    account_no: "",
    bank_name: "",
    bank_branch: "",
    ifsc_code: ""

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
  const [volunteer, setVolunteer] = useState(null);

  // This effect handles authentication. It runs once when the component mounts.
  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem("volunteerProfile");
      if (storedProfile) {
        const v = JSON.parse(storedProfile);
        if (v && v.name) {
          setVolunteer(v); // Set volunteer state if profile is valid
        } else {
          navigate("/volunteerlogin"); // Navigate to login if profile is invalid
        }
      } else {
        // If no profile is found, alert the user and redirect to login
        alert("You must be logged in to access this page.");
        navigate("/volunteerlogin");
      }
    } catch (e) {
      // If there's an error parsing, clear storage and redirect
      localStorage.removeItem("volunteerProfile");
      navigate("/volunteerlogin");
    }
  }, [navigate]);


  // Handles logging out the volunteer
  const handleLogout = () => {
    localStorage.removeItem("volunteerProfile");
    setVolunteer(null);
    navigate("/login"); // Navigate to the main role selection page
  };

  // Handles changes in text input fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handles changes in file input fields
  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFiles({ ...files, [field]: file });
    }
  };

  // Checks if all required files have been uploaded
  const allUploaded =
    Object.values(files).every((f) => f !== null) &&
    (formData.account_no || "").toString().trim() !== "" &&
    (formData.bank_name || "").toString().trim() !== "" &&
    (formData.bank_branch || "").toString().trim() !== "" &&
    (formData.ifsc_code || "").toString().trim() !== "";

  // Handles the form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim() || !formData.contact.trim()) {
      alert("⚠️ Please fill in all mandatory fields: First Name, Last Name, Email, and Parent Number.");
      return;
    }
    // Ensure age (if provided) is at least 6
    const ageVal = formData.age !== "" && formData.age !== null ? Number(formData.age) : null;
    if (ageVal !== null && !Number.isNaN(ageVal) && ageVal < 6) {
      alert("⚠️ Age must be at least 6 years.");
      return;
    }
    if (!allUploaded) {
      alert("⚠️ Please upload all required documents before submitting.");
      return;
    }
    // Here you would typically send the data to your backend
    console.log("Form Data:", formData);
    console.log("Files:", files);
    console.log("Bank Account:", bankAccount);
    alert("✅ Student details submitted successfully!");
  };

  // Helper function to render each file upload field
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
    <div className="form-page-wrapper">
      <div className="topbar">
        <div className="left-top"></div>
        <div className="right-top">
          <VolunteerProfile volunteer={volunteer} onLogout={handleLogout} />
        </div>
      </div>

      <div className="form-container">
        <h1 className="form-title">STUDENT APPLICATION FORM</h1>
        <form onSubmit={handleSubmit}>
          {/* Personal Data Section */}
          <div className="section">
            <h2>1. Personal Data</h2>
            <div className="form-group">
              <label>
                <span className="field-label">First Name<span className="required">*</span></span>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} required />
              </label>
              <label>
                Middle Name
                <input type="text" name="middle_name" value={formData.middle_name} onChange={handleInputChange} />
              </label>
              <label>
                <span className="field-label">Last Name<span className="required">*</span></span>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} required />
              </label>
            </div>
            <div className="form-group">
              <label>
                <span className="field-label">Parents Full Names<span className="required">*</span></span>
                <input type="text" name="parents_full_names" value={formData.parents_full_names} onChange={handleInputChange} placeholder="e.g. Father: John Doe; Mother: Jane Doe" required />
              </label>
              <label>
                <span className="field-label">Earning members of the family<span className="required">*</span></span>
                <input type="text" name="earning_members" value={formData.earning_members} onChange={handleInputChange} placeholder="e.g. Father - Tailor" required />
              </label>
            </div>
            <div className="form-group">
               <label>
                 Date of Birth
                 <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} required />
               </label>
               <label>
                 Age
                 <input type="number" name="age" value={formData.age} onChange={handleInputChange} />
               </label>
               <label>
                 Place of Birth
                 <input type="text" name="pob" value={formData.pob} onChange={handleInputChange} />
               </label>
               <label>
                 Address
                 <input type="text" name="address" value={formData.nationality} onChange={handleInputChange} />
               </label>
             </div>
             <div className="form-group">
               <label>
                 <span className="field-label">Parent Number<span className="required">*</span></span>
                 <input type="text" name="contact" value={formData.contact} onChange={handleInputChange} required />
               </label>
               <label>
                 Whatsapp Number
                 <input type="text" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} />
               </label>
               <label>
                 Student Number
                 <input type="text" name="student_contact" value={formData.student_contact || ""} onChange={handleInputChange} />
               </label>
               <label>
                 <span className="field-label">Email<span className="required">*</span></span>
                 <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
               </label>
             </div>
          </div>

          {/* Academic Data Section */}
          <div className="section">
            <h2>2. Academic Details</h2>
            <div className="form-group">
               <label>
                 Name of School and college
                 <input type="text" name="school" value={formData.school} onChange={handleInputChange} required />
               </label>
               <label>
                 Which Branch
                 <input type="text" name="branch" value={formData.branch} onChange={handleInputChange} />
               </label>
             </div>
             <div className="form-group">
               <label>
                 Percentage scored in previous academic year
                 <input type="text" name="prev_percent" value={formData.prev_percent} onChange={handleInputChange} />
               </label>
               <label>
                 Percentage scored in present acedemic year
                 <input type="text" name="present_percent" value={formData.present_percent} onChange={handleInputChange} />
               </label>
             </div>
          </div>

          {/* Other Data Section */}
          <div className="section">
            <h2>3. Other Details</h2>
            <div className="form-group">
               <label>
                 Course / Class Fee
                 <input type="text" name="fee" value={formData.fee} onChange={handleInputChange} />
               </label>
               <label>
                 Does she work to support her family, If Yes what kind of job?
                 <input type="text" name="job" value={formData.job} onChange={handleInputChange} />
               </label>
             </div>
             <div className="form-group">
               <label>
                 "What are her career aspirations and planned courses for the next two years?"
                 <input type="text" name="aspiration" value={formData.aspiration} onChange={handleInputChange} />
               </label>
               <label>
                 Is she currently getting any scholarship or Govt help or any financial assistance for her education or health
                 <input type="text" name="scholarship" value={formData.scholarship} onChange={handleInputChange} />
               </label>
             </div>
             <div className="form-group">
               <label>
                 Achievement Certificates
                 <input type="text" name="certificates" value={formData.certificates} onChange={handleInputChange} />
               </label>
               <label>
                 From how long they living in this Area. Is she temporary living (migrant worker)?
                 <input type="text" name="years_area" value={formData.years_area} onChange={handleInputChange} />
               </label>
             </div>
          </div>

          {/* Document Upload Section */}
          <div className="section">
            <h2>4. Document Upload</h2>
            {renderUploadField("School / College ID", "school_id")}
            {renderUploadField("Aadhaar Card", "aadhaar")}
            {renderUploadField("Income Proof", "income_proof")}
            {renderUploadField("Marks Sheet", "marksheet")}
            {renderUploadField("Passport Size Photo", "passport_photo")}
            <div className="upload-field">
              <span className="label">Bank Account Details</span>
              <input type="text" placeholder="Enter bank account details" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} required />
            </div>
            {renderUploadField("Fees Receipt", "fees_receipt")}
            {renderUploadField("Volunteer Signature", "volunteer_signature")}
            {renderUploadField("Student Signature", "student_signature")}
          </div>

          {/* Submit Button */}
          <div className="submit-container">
            <button type="submit" disabled={!allUploaded}>
              Submit Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}