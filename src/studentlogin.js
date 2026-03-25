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
  const [showErrors, setShowErrors] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowErrors(true);

    // Validate only on submit
    const emailError = email.trim() === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 'Please enter valid email' : '';
    const pwdErrors = !password ? [] : validatePassword(password);

    if (emailError || pwdErrors.length > 0) {
      toast.error("Please fix errors");
      return;
    }

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    try {
      const { data, error } = await supabase
        .from("eligible_students")
        .select("*")
        .ilike("email", cleanEmail)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        toast.error("You are not eligible");
        return;
      }

      if (!data.password) {
        toast.info("First time - set password");
        navigate("/set-password", { state: { email: cleanEmail } });
        return;
      }

      if (cleanPassword !== data.password.trim()) {
        toast.error("Invalid credentials");
        return;
      }

      toast.success("Login successful!");

      localStorage.setItem("studentEmail", cleanEmail);
      localStorage.setItem("isStudentLoggedIn", "true");

      navigate("/student-dashboard");
    } catch (err) {
      toast.error("Error occurred");
    }
  };

  const validatePassword = (value) => {
    const errors = [];
    if (!/[a-z]/.test(value)) errors.push("Must include lowercase letter");
    if (!/[A-Z]/.test(value)) errors.push("Must include uppercase letter");
    if (!/[0-9]/.test(value)) errors.push("Must include number");
    if (!/[@$!%*?&]/.test(value)) errors.push("Must include special character");
    if (value.length < 8) errors.push("At least 8 characters");
    return errors;
  };

  // Errors computed but shown only after submit
  const currentEmailError = showErrors && (email.trim() === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) ? 'Please enter valid email' : '';
  const currentPasswordErrors = showErrors && password.length > 0 ? validatePassword(password) : [];

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Student Login</h1>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={currentEmailError ? "input-error" : ""}
          />
          {currentEmailError && <p className="error-text">{currentEmailError}</p>}

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password (leave empty if first time)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: "42px" }}
              className={currentPasswordErrors.length ? "input-error" : ""}
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
              {showPassword ? "👁" : "👁"}
            </span>
          </div>

          {currentPasswordErrors.length > 0 && (
            <ul className="error-text">
              {currentPasswordErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          )}

          <button type="submit">Login</button>
        </form>

        <p style={{ marginTop: "10px", textAlign: "center", color: "#2563eb", cursor: "pointer" }}
           onClick={() => toast.info("First time? Enter email only and click login")}>
          First time user?
        </p>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}

