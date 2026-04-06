import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import supabase from "./supabaseClient";
import "./studentlogin.css";

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showErrors, setShowErrors] = useState(false);


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

  // eslint-disable-next-line no-undef
  const validatePassword = (value) => {
    const errors = [];
    if (!/[a-z]/.test(value)) errors.push("Must include lowercase letter");
    if (!/[A-Z]/.test(value)) errors.push("Must include uppercase letter");
    if (!/[0-9]/.test(value)) errors.push("Must include number");
    if (!/[@$!%*?&]/.test(value)) errors.push("Must include special character");
    if (value.length < 8) errors.push("At least 8 characters");
    return errors;
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);

  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowErrors(true);

    const pwdErrors = validatePassword(password);
    if (pwdErrors.length > 0) {
      toast.error("Please fix password requirements");
      return;
    }

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

  const currentPasswordErrors = showErrors ? validatePassword(password) : [];

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Set Your Password</h1>

        <form onSubmit={handleSubmit}>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={handlePasswordChange}
className={currentPasswordErrors.length > 0 ? "input-error" : ""}
              style={{ padding: "10px 42px 10px 10px", margin: "10px 0", width: "250px" }}
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

          <div style={{ position: "relative" }}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              className="input-error"
              style={{ padding: "10px 42px 10px 10px", margin: "10px 0", width: "250px" }}
            />
            <span
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
              {showConfirmPassword ? "👁" : "👁"}
            </span>
          </div>

          <button type="submit" style={{ padding: "10px 20px", width: "250px" }}>
            Set Password
          </button>
        </form>

        <ToastContainer position="top-center" />
      </div>
    </div>
  );
}