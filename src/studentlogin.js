// src/StudentLogin.js

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import supabase from "./supabaseClient";
import "./studentlogin.css";

export default function StudentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);

  const navigate = useNavigate();

  // ---------------- VALIDATIONS ---------------- 

  const validateEmail = (value) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const validatePassword = (value) => {
    const errors = [];
    if (!/[a-z]/.test(value)) errors.push("Must include a lowercase letter");
    if (!/[A-Z]/.test(value)) errors.push("Must include an uppercase letter");
    if (!/[0-9]/.test(value)) errors.push("Must include a number");
    if (!/[@$!%*?&]/.test(value))
      errors.push("Must include a special character (@$!%*?&)");
    if (value.length < 8)
      errors.push("Must be at least 8 characters long");
    return errors;
  };

  // ---------------- SUBMIT ---------------- 

  const handleSubmit = async (e) => {
    e.preventDefault();

    const eError = validateEmail(email);
    const pErrors = validatePassword(password);

    setEmailError(eError);
    setPasswordErrors(pErrors);

    if (eError || pErrors.length > 0) {
      toast.error("Please fix the highlighted errors");
      return;
    }

    try {
      // 🔍 Check in eligible_students table
      const { data, error } = await supabase
        .from("eligible_students")
        .select("*")
        .eq("email", email)
        .single();

      if (error || !data) {
        toast.error("You are not eligible");
        return;
      }

      // 🔐 FIRST TIME LOGIN
      if (!data.password) {
        toast.info("First time login - set password");
        navigate("/set-password", { state: { email } });
        return;
      }

      // 🔑 PASSWORD CHECK
      if (data.password !== password) {
        toast.error("Invalid credentials");
        return;
      }

      // ✅ SUCCESS
      toast.success("Login successful 🎉");
      navigate("/student-dashboard");

    } catch (err) {
      toast.error(err.message);
    }
  };

  // ---------------- UI ---------------- 

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Student Login</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(validateEmail(e.target.value));
            }}
            required
          />
          {emailError && <p className="error-text">{emailError}</p>}

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordErrors(validatePassword(e.target.value));
              }}
              style={{ paddingRight: "42px" }}
              required
            />

            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#555",
                fontSize: "18px",
              }}
            >
              {showPassword ? "👁‍🗨" : "👁"}
            </span>
          </div>

          {passwordErrors.length > 0 && (
            <ul
              style={{
                color: "red",
                fontSize: "0.9rem",
                marginTop: "6px",
                paddingLeft: "18px",
              }}
            >
              {passwordErrors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          )}

          <button type="submit">Login</button>
        </form>

        <p
          style={{
            marginTop: "10px",
            textAlign: "center",
            color: "#2563eb",
            cursor: "pointer",
          }}
          onClick={() => toast.info("Use first-time login if no password")}
        >
          Forgot password?
        </p>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}