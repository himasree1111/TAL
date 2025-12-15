// src/ResetPassword.js
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import supabase from "./supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role");

  useEffect(() => {
  const init = async () => {
    try {
      const { data, error } =
        await supabase.auth.exchangeCodeForSession(window.location.href);

      if (error) {
        toast.error("Invalid or expired reset link");
      }
    } catch (err) {
      console.error(err);
      toast.error("Reset link verification failed");
    } finally {
      setLoading(false);
    }
  };

  init();
}, []);


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      toast.success("Password updated successfully!");

      // Logout after reset
      await supabase.auth.signOut();

      // Redirect based on role
      if (role === "admin") {
        navigate("/adminlogin");
      } else {
        navigate("/volunteerlogin");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="auth-container">
        <p style={{ color: "white", textAlign: "center" }}>
          Verifying reset link...
        </p>
        <ToastContainer position="top-center" />
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Reset Password</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit">Update Password</button>
        </form>
      </div>

      <ToastContainer position="top-center" />
    </div>
  );
}
