import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import supabase from "./supabaseClient";
import {testConnection } from "./testSupabase";
import CoverPage from "./CoverPage";
import StudentLogin from "./studentlogin";
import LoginProfiles from "./loginProfiles";
import VolunteerLogin from "./volunteerlogin";
import DonorLogin from "./donorlogin";
import Register from "./register";
import StudentForm from "./studentform";
import StudentDashboard from "./studentdashboard";
import DonorDashboard from "./DonorDashboard"; // <-- 1. IMPORT DonorDashboard
import AdminDashboard from "./AdminDashboard"; // admin dashboard

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
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        
        {/* Donor flow */}
        <Route path="/donor-dashboard" element={<DonorDashboard />} /> {/* <-- 2. ADD NEW ROUTE */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;