// src/VolunteerLogin.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import supabase from "./supabaseClient";
import "./studentlogin.css";

export default function VolunteerLogin() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* ---------------- VALIDATIONS ---------------- */

  const validateEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validateName = (value) => {
    if (!value.trim()) return "Full name is required";
    if (!/^[A-Za-z\s]+$/.test(value))
      return "Name can contain only letters and spaces";
    if (value.trim().length < 2)
      return "Name must be at least 2 characters";
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

  /* ---------------- SESSION CHECK ---------------- */

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.user_metadata?.user_type === "volunteer") {
        navigate("/volunteer-dashboard");
      }
      setLoading(false);
    };
    checkSession();
  }, [navigate]);

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      toast.error("Invalid email format");
      return;
    }

    if (!isSignIn) {
      const err = validateName(name);
      setNameError(err);
      if (err) {
        toast.error("Fix name field");
        return;
      }
    }

    const pwdErrors = validatePassword(password);
    setPasswordErrors(pwdErrors);

    if (pwdErrors.length > 0) {
      toast.error("Please fix password requirements");
      return;
    }

    try {
      if (isSignIn) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        if (data.user.user_metadata.user_type !== "volunteer") {
          await supabase.auth.signOut();
          toast.error("Unauthorized access");
          return;
        }

        toast.success("Login successful");
        navigate("/volunteer-dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, user_type: "volunteer" },
          },
        });
        if (error) throw error;

        toast.success("Account created successfully");
        setIsSignIn(true);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* ---------------- FORGOT PASSWORD ---------------- */

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter email first");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/reset-password",
    });

    if (error) toast.error(error.message);
    else toast.success("Password reset email sent");
  };

  if (loading) return <div>Loading...</div>;

  /* ---------------- UI ---------------- */

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>{isSignIn ? "Volunteer Sign In" : "Volunteer Sign Up"}</h1>

        <form onSubmit={handleSubmit}>
          {!isSignIn && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(validateName(e.target.value));
                }}
                required
              />
              {nameError && (
                <p className="error-text">{nameError}</p>
              )}
            </>
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* PASSWORD FIELD WITH EYE ICON */}
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                const value = e.target.value;
                setPassword(value);
                setPasswordErrors(validatePassword(value));
              }}
              required
              style={{ paddingRight: "40px" }}
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
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "👁‍🗨" : "👁"}
            </span>
          </div>

          {passwordErrors.length > 0 && (
            <ul className="error-text">
              {passwordErrors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          )}

          <button type="submit">
            {isSignIn ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <p className="switch-text">
          {isSignIn ? "New here?" : "Already have an account?"}{" "}
          <span onClick={() => setIsSignIn(!isSignIn)}>
            {isSignIn ? "Create an account" : "Sign in"}
          </span>
        </p>

        {isSignIn && (
          <p
            onClick={handleForgotPassword}
            style={{
              marginTop: "10px",
              textAlign: "center",
              color: "#6a5acd",
              cursor: "pointer",
            }}
          >
            Forgot password?
          </p>
        )}
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}
