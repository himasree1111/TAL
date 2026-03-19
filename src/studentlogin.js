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

  const navigate = useNavigate();

  // ---------------- VALIDATION ----------------
  const validateEmail = (value) => {
    if (!value.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const eError = validateEmail(cleanEmail);
    setEmailError(eError);

    if (eError) {
      toast.error(eError);
      return;
    }

    try {
      // 🔍 STEP 1: Check eligibility
      const { data: eligible, error: eligibleError } = await supabase
        .from("eligible_students")
        .select("*")
        .eq("email", cleanEmail)
        .maybeSingle();

      console.log("ELIGIBLE:", eligible);

      if (eligibleError || !eligible) {
        toast.error("You are not eligible");
        return;
      }

      // 🔐 STEP 2: Check student_auth
      const { data: auth } = await supabase
        .from("student_auth")
        .select("*")
        .eq("email", cleanEmail)
        .maybeSingle();

      console.log("AUTH:", auth);

      // 👉 FIRST TIME USER
      if (!auth || !auth.password) {
        toast.info("First time login - please set password");
        navigate("/set-password", { state: { email: cleanEmail } });
        return;
      }

      // ❌ Password not entered
      if (!cleanPassword) {
        toast.error("Please enter password");
        return;
      }

      // 🔑 PASSWORD CHECK
      if (auth.password !== cleanPassword) {
        toast.error("Invalid credentials");
        return;
      }

      // ✅ SUCCESS
      toast.success("Login successful 🎉");

      // Store session locally
      localStorage.setItem("studentEmail", cleanEmail);
      localStorage.setItem("isStudentLoggedIn", "true");

      navigate("/student-dashboard");

    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Student Login</h1>

        <form onSubmit={handleSubmit}>
          {/* EMAIL */}
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

          {/* PASSWORD */}
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password (leave empty if first time)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: "42px" }}
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

          <button type="submit">Login</button>
        </form>

        <p
          style={{
            marginTop: "10px",
            textAlign: "center",
            color: "#2563eb",
            cursor: "pointer",
          }}
          onClick={() =>
            toast.info("If first time, just enter email and click login")
          }
        >
          First time user?
        </p>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}