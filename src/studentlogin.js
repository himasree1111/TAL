import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { checkEligibility, handleLogin, handleSignup } from "./authService";
import supabase from "./supabaseClient";
import "./studentlogin.css";

export default function StudentLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  const navigate = useNavigate();

  /**
   * Validate email format
   */
  const validateEmail = (emailValue) => {
    const trimmed = emailValue.trim();
    return trimmed === "" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
      ? "Please enter a valid email"
      : "";
  };

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

  /**
   * Handle email input and check eligibility
   */
  const handleEmailChange = async (e) => {
    const value = e.target.value;
    setEmail(value);

    // Only check eligibility when user stops typing
    if (value.trim().length >= 5) {
      try {
        const student = await checkEligibility(value);
        if (student) {
          // User is eligible
          setIsFirstTimeUser(!student.auth_id);
          if (!student.auth_id) {
            setPassword(""); // Clear password field for first-time users
          }
        } else {
          setIsFirstTimeUser(false);
        }
      } catch (err) {
        console.error("Error checking eligibility:", err);
      }
    }
  };

  /**
   * Handle form submission (Login or Signup)
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowErrors(true);
    setIsLoading(true);

    try {
      // Validate email
      const emailError = validateEmail(email);
      if (emailError) {
        toast.error(emailError);
        setIsLoading(false);
        return;
      }

      const cleanEmail = email.trim();

      // 1. Check if user is eligible
      const student = await checkEligibility(cleanEmail);
      if (!student) {
        toast.error("You are not eligible to access this dashboard");
        setIsLoading(false);
        return;
      }

      // 2. Check if it's a first-time user
      if (!student.auth_id) {
        // First-time user flow: validate password and proceed to SetPassword page
        if (!password) {
          toast.error("Please enter a password");
          setIsLoading(false);
          return;
        }

        const pwdErrors = validatePassword(password);
        if (pwdErrors.length > 0) {
          toast.error("Please fix password requirements");
          setIsLoading(false);
          return;
        }

        // Navigate to SetPassword page with credentials
        navigate("/set-password", { 
          state: { 
            email: cleanEmail,
            password: password,
            isNewUser: true
          } 
        });
      } else {
        // Existing user flow: require password
        if (!password) {
          toast.error("Please enter your password");
          setIsLoading(false);
          return;
        }

        // Try to login with Supabase Auth
        const { user, session } = await handleLogin(cleanEmail, password);

        if (user && session) {
          // Store session info
          localStorage.setItem("studentEmail", cleanEmail);
          localStorage.setItem("studentId", user.id);
          localStorage.setItem("isStudentLoggedIn", "true");
          localStorage.setItem("studentAuthToken", session.access_token);

          toast.success("Login successful! 🎉");

          // Redirect to dashboard
          setTimeout(() => {
            navigate("/student-dashboard");
          }, 1500);
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.message || "An error occurred. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle forgot password
   */
  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Enter your email first");
      return;
    }

    try {
      const student = await checkEligibility(email.trim());
      if (!student) {
        toast.error("Email not found in our system");
        return;
      }

      const redirectUrl =
        process.env.REACT_APP_RESET_PASSWORD_URL ||
        window.location.origin + "/reset-password?role=student";
      console.log("Student reset redirect URL:", redirectUrl);

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: redirectUrl }
      );

      if (error) {
        console.error("resetPasswordForEmail error:", error);
        toast.error(error.message);
      } else {
        toast.success("Password reset email sent. Check your inbox.");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      toast.error("Error processing request");
    }
  };

  // Get error messages
  const currentEmailError =
    showErrors && validateEmail(email) ? validateEmail(email) : "";
  const currentPasswordErrors =
    showErrors && password.length > 0 ? validatePassword(password) : [];

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Student Login</h1>

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading}
              className={currentEmailError ? "input-error" : ""}
              autoComplete="email"
            />
            {currentEmailError && (
              <p className="error-text">{currentEmailError}</p>
            )}
          </div>

          {/* Password Input */}
          {email.trim().length >= 5 && (
            <div style={{ position: "relative", animation: "slideIn 0.3s ease" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder={
                  isFirstTimeUser
                    ? "Create a password"
                    : "Enter your password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                style={{ paddingRight: "42px" }}
                className={currentPasswordErrors.length ? "input-error" : ""}
                autoComplete={isFirstTimeUser ? "new-password" : "current-password"}
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
          )}

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

          {/* Submit Button */}
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Processing..." : isFirstTimeUser ? "Continue" : "Login"}
          </button>
        </form>

        {/* Helper Links */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <p
            style={{ color: "#2563eb", cursor: "pointer", margin: "8px 0", fontSize: "14px" }}
            onClick={() =>
              toast.info(
                "Enter your email and we'll help you set up your account"
              )
            }
          >
            First time user?
          </p>

          <p
            className="forgot-password"
            style={{
              textAlign: "center",
              margin: "8px 0",
            }}
            onClick={handleForgotPassword}
          >
            Forgot password?
          </p>
        </div>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}

