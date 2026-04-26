import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { handleSignup } from "./authService";
import "./studentlogin.css";

export default function SetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const initialPassword = location.state?.password;

  // Pre-fill password if coming from student login
  useEffect(() => {
    if (initialPassword) {
      setPassword(initialPassword);
    }
  }, [initialPassword]);

  // 🚨 If user directly opens page without email from login
  useEffect(() => {
    if (!email) {
      toast.error("Invalid access. Please login first.");
      navigate("/student-login");
    }
  }, [email, navigate]);

  /**
   * Validate password strength
   */
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

  /**
   * Handle password creation and signup
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowErrors(true);
    setIsLoading(true);

    try {
      // Validate password
      const pwdErrors = validatePassword(password);
      if (pwdErrors.length > 0) {
        toast.error("Please fix password requirements");
        setIsLoading(false);
        return;
      }

      // Check if fields are filled
      if (!password || !confirmPassword) {
        toast.error("Please fill all fields");
        setIsLoading(false);
        return;
      }

      // Check if passwords match
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        setIsLoading(false);
        return;
      }

      // Sign up user with Supabase Auth
      const { user, session } = await handleSignup(email, password);

      if (user && session) {
        // Store session info
        localStorage.setItem("studentEmail", email);
        localStorage.setItem("studentId", user.id);
        localStorage.setItem("isStudentLoggedIn", "true");
        localStorage.setItem("studentAuthToken", session.access_token);

        toast.success("Account created successfully! 🎉");

        // Redirect to dashboard
        setTimeout(() => {
          navigate("/student-dashboard");
        }, 1500);
      }
    } catch (err) {
      console.error("Signup error:", err);
      const errorMessage = err.message || "Error creating account. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPasswordErrors = showErrors ? validatePassword(password) : [];
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Create Your Password</h1>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>
          Secure your account with a strong password
        </p>

        <form onSubmit={handleSubmit}>
          {/* New Password Input */}
          <div style={{ position: "relative", marginBottom: "15px" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={password}
              onChange={handlePasswordChange}
              disabled={isLoading}
              className={currentPasswordErrors.length > 0 ? "input-error" : ""}
              style={{
                padding: "10px 42px 10px 10px",
                margin: "10px 0",
                width: "100%",
                boxSizing: "border-box",
              }}
              autoComplete="new-password"
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
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </span>
          </div>

          {/* Password Requirements */}
          {currentPasswordErrors.length > 0 && (
            <div className="password-requirements" aria-live="polite">
              <p className="password-requirements-title">Password must include</p>
              <ul className="password-requirements-list">
                {currentPasswordErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Confirm Password Input */}
          <div style={{ position: "relative", marginBottom: "15px" }}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              disabled={isLoading}
              className={
                confirmPassword && !passwordsMatch ? "input-error" : ""
              }
              style={{
                padding: "10px 42px 10px 10px",
                margin: "10px 0",
                width: "100%",
                boxSizing: "border-box",
              }}
              autoComplete="new-password"
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
              {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
            </span>
          </div>

          {/* Password Match Indicator */}
          {confirmPassword && passwordsMatch && (
            <p style={{ color: "#10b981", fontSize: "12px", marginBottom: "10px" }}>
              ✓ Passwords match
            </p>
          )}

          {confirmPassword && !passwordsMatch && (
            <p style={{ color: "#ef4444", fontSize: "12px", marginBottom: "10px" }}>
              ✗ Passwords do not match
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || currentPasswordErrors.length > 0}
            style={{
              padding: "10px 20px",
              width: "100%",
              marginTop: "20px",
              opacity:
                isLoading || currentPasswordErrors.length > 0 ? 0.6 : 1,
              cursor:
                isLoading || currentPasswordErrors.length > 0
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <ToastContainer position="top-center" autoClose={3000} />
      </div>
    </div>
  );
}