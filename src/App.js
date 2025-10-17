import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CoverPage from "./CoverPage";
import LoginProfiles from "./loginProfiles";
import VolunteerLogin from "./volunteerlogin";
import DonorLogin from "./donorlogin";
import Register from "./register";
import StudentForm from "./studentform";
import StudentDashboard from "./studentdashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Cover page shows first */}
        <Route path="/" element={<CoverPage />} />

        {/* Login profiles page */}
        <Route path="/login" element={<LoginProfiles />} />

        {/* Volunteer auth */}
        <Route path="/volunteerlogin" element={<VolunteerLogin />} />
        <Route path="/donorlogin" element={<DonorLogin />} />
        <Route path="/register" element={<Register />} />

        {/* Student flow */}
        <Route path="/studentform" element={<StudentForm />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
