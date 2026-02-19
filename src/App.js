import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute"; // ⭐ ADD THIS

import CoverPage from "./CoverPage";
import StudentLogin from "./studentlogin";
import LoginProfiles from "./loginProfiles";
import VolunteerLogin from "./volunteerlogin";
import DonorLogin from "./donorlogin";
import Register from "./register";
import StudentForm from "./studentform";
import StudentDashboard from "./studentdashboard";
import DonorDashboard from "./DonorDashboard";
import AdminDashboard from "./AdminDashboard";
import Adminlogin from "./adminlogin";
import VolunteerDashboard from "./VolunteerDashboard";
import ResetPassword from "./ResetPassword";

function App() {
  return (
    <Router>
      <Routes>
        {/* ✅ Only public page */}
        <Route path="/" element={<CoverPage />} />

        {/* 🔒 Protected Routes (cannot open by URL) */}
        <Route
          path="/login"
          element={
            <ProtectedRoute>
              <LoginProfiles />
            </ProtectedRoute>
          }
        />

        <Route
          path="/volunteerlogin"
          element={
            <ProtectedRoute>
              <VolunteerLogin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/volunteer-dashboard"
          element={
            <ProtectedRoute>
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-login"
          element={
            <ProtectedRoute>
              <StudentLogin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/donorlogin"
          element={
            <ProtectedRoute>
              <DonorLogin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/donor-dashboard"
          element={
            <ProtectedRoute>
              <DonorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/adminlogin"
          element={
            <ProtectedRoute>
              <Adminlogin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/studentform"
          element={
            <ProtectedRoute>
              <StudentForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/studentform/:id"
          element={
            <ProtectedRoute>
              <StudentForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/register"
          element={
            <ProtectedRoute>
              <Register />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reset-password"
          element={
            <ProtectedRoute>
              <ResetPassword />
            </ProtectedRoute>
          }
        />

        {/* ⭐ Catch all → always CoverPage */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
