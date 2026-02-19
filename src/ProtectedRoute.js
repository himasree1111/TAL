import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const allowed = sessionStorage.getItem("allowAccess");

  // If user did NOT come from cover page → send to cover page
  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  // Otherwise allow access
  return children;
}
