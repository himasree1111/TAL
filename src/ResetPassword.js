import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import supabase from "./supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./studentlogin.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role");

  useEffect(() => {
    const init = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("exchangeCodeForSession error:", error);
            toast.error("Invalid or expired reset link");
          }
        } else if (window.location.hash.includes("access_token")) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const access_token = hashParams.get("access_token");
          const refresh_token = hashParams.get("refresh_token");
          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (error) {
              console.error("setSession error:", error);
              toast.error("Invalid or expired reset link");
            }
          }
        }

        const { data } = await supabase.auth.getSession();
        setHasSession(!!data.session);
      } catch (err) {
        console.error("Session init error:", err);
        toast.error("Failed to verify reset link");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const validatePassword = (value) => {
    const errors = [];
    if (!/[a-z]/.test(value)) errors.push("Must include lowercase letter");
    if (!/[A-Z]/.test(value)) errors.push("Must include uppercase letter");
    if (!/[0-9]/.test(value)) errors.push("Must include number");
    if (!/[@$!%*?&]/.test(value)) errors.push("Must include special character");
    if (value.length < 8) errors.push("At least 8 characters");
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowErrors(true);

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast.error("No valid session found. Please use the reset link from your email.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const pwdErrors = validatePassword(password);
    if (pwdErrors.length > 0) {
      toast.error("Please fix password requirements");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;

      if (role === "admin") {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email) {
          const { error: adminError } = await supabase
            .from("admins")
            .update({ password: password })
            .eq("email", session.user.email);
          if (adminError) console.error("Failed to update admins table:", adminError);
        }
      }

      toast.success("Password updated successfully!");
      await supabase.auth.signOut();

      setTimeout(() => {
        if (role === "admin") {
          navigate("/adminlogin");
        } else if (role === "student") {
          navigate("/student-login");
        } else if (role === "volunteer") {
          navigate("/volunteerlogin");
        } else {
          navigate("/volunteerlogin");
        }
      }, 1500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPasswordErrors = showErrors ? validatePassword(password) : [];
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <h1>Reset Password</h1>
          <p style={{ color: "#6b7280" }}>Verifying reset link...</p>
          <ToastContainer position="top-center" autoClose={3000} />
        </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>Reset Password</h1>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>
          Create a new secure password for your account
        </p>

        {!hasSession && (
          <p style={{ color: "#ef4444", fontSize: "14px", marginBottom: "15px" }}>
            Invalid or expired link. Please use the reset link from your email.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ position: "relative", marginBottom: "15px" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
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

          <div style={{ position: "relative", marginBottom: "15px" }}>
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              className={confirmPassword && !passwordsMatch ? "input-error" : ""}
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

          <button
            type="submit"
            disabled={isSubmitting || currentPasswordErrors.length > 0}
            style={{
              padding: "10px 20px",
              width: "100%",
              marginTop: "20px",
              opacity: isSubmitting || currentPasswordErrors.length > 0 ? 0.6 : 1,
              cursor: isSubmitting || currentPasswordErrors.length > 0 ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>

        <ToastContainer position="top-center" autoClose={3000} />
      </div>
  );
}