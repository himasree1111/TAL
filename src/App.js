// import React from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// import CoverPage from "./CoverPage";          // Landing page
// import VolunteerLogin from "./volunteerlogin"; // Volunteer login
// import Register from "./register";             // Volunteer register
// import StudentForm from "./studentform";       // Student form
// import StudentDocs from "./studentdocs";       // Student docs
// import LoginProfiles from "./login";
// function App() {
//   return (
//     <Router>
//       <Routes>
//         {/* Cover page shows first */}
//         <Route path="/" element={<CoverPage />} />

//         {/* Volunteer auth */}
//         <Route path="/volunteerlogin" element={<VolunteerLogin />} />
//         <Route path="/register" element={<Register />} /> {/* Register route added */}

//         {/* Student flow */}
//         <Route path="/studentform" element={<StudentForm />} />
//         <Route path="/studentdocs" element={<StudentDocs />} />
//       </Routes>
//     </Router>
//   );
// }

// //export default App;



import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CoverPage from "./CoverPage";
import LoginProfiles from "./loginProfiles";
import RoleLogin from "./RoleLogin";
<<<<<<< HEAD
import VolunteerLogin from "./volunteerlogin";
import Register from "./register";
import StudentForm from "./studentform";

import VolunteerLogin from "./volunteerlogin";  // import volunteer login
import Register from "./register";              // import register
import StudentForm from "./studentform";        // import student form
import StudentDashboard from "./studentdashboard";


function App() {
  return (
    <Router>
      <Routes>
        {/* Cover page shows first */}
        <Route path="/" element={<CoverPage />} />

        {/* Volunteer auth */}
        <Route path="/volunteerlogin" element={<VolunteerLogin />} />
        <Route path="/register" element={<Register />} />

        {/* Student flow */}
        <Route path="/studentform" element={<StudentForm />} />
<<<<<<< HEAD
  {/* StudentDocs route removed as requested */}
=======
        <Route path="/student-dashboard" element={<StudentDashboard />} />
>>>>>>> c9069c44d261769edaf1de5381fec5a7b348344c
      </Routes>
    </Router>
  );
}

export default App;
