import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import supabase from "./supabaseClient";

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;

  // 🚨 if user directly opens page
  useEffect(() => {
    if (!email) {
      toast.error("Invalid access. Please login first.");
      navigate("/student-login");
    }
  }, [email, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const { error } = await supabase
        .from("eligible_students")
        .update({
          password: password,
          is_verified: true,
        })
        .eq("email", email);

      if (error) {
        toast.error("Error setting password");
        return;
      }

      toast.success("Password set successfully 🎉");

      setTimeout(() => {
        navigate("/student-login");
      }, 1500);

    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  return (
    <div style={{ padding: "40px", textAlign: "center" }}>
      <h2>Set Your Password</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: "10px", margin: "10px", width: "250px" }}
        />

        <br />

        <input
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          style={{ padding: "10px", margin: "10px", width: "250px" }}
        />

        <br />

        <button type="submit" style={{ padding: "10px 20px" }}>
          Set Password
        </button>
      </form>

      <ToastContainer />
    </div>
  );
}