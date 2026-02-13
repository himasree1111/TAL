// src/AdminLogin.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import supabase from "./supabaseClient";
import { validatePassword, validateName, validateEmail } from "./utils/validation";
import "react-toastify/dist/ReactToastify.css";
import "./studentlogin.css";

export default function AdminLogin() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [nameError, setNameError] = useState("");

  const navigate = useNavigate();

  /* ---------------- SESSION CHECK ---------------- */

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.user_metadata?.user_type === "admin") {
        navigate("/admin-dashboard");
      }
    };
    checkSession();
  }, [navigate]);

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const eErr = validateEmail(email);
    const nErr = !isSignIn ? validateName(name) : "";
    const pErrs = validatePassword(password);

    setEmailError(eErr);
    setNameError(nErr);
    setPasswordErrors(pErrs);

    if (eErr || nErr || pErrs.length > 0) {
      toast.error("Please fix the highlighted errors");
      return;
    }

    try {
      if (isSignIn) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        if (data.user.user_metadata.user_type !== "admin") {
          await supabase.auth.signOut();
          toast.error("Access denied");
          return;
        }

        toast.success("Admin login successful 🎉");
        navigate("/admin-dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, user_type: "admin" },
          },
        });
        if (error) throw error;

        toast.success("Admin account created 🎉");
        setIsSignIn(true);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* ---------------- FORGOT PASSWORD ---------------- */

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });

    if (error) toast.error(error.message);
    else toast.success("Password reset email sent 📧");
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>{isSignIn ? "Admin Sign In" : "Admin Sign Up"}</h1>

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
                className={nameError ? "input-error" : ""}
              />
              {nameError && <p className="error-text">{nameError}</p>}
            </>
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError(validateEmail(e.target.value));
            }}
            className={emailError ? "input-error" : ""}
          />
          {emailError && <p className="error-text">{emailError}</p>}

          {/* PASSWORD WITH EYE ICON */}
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordErrors(validatePassword(e.target.value));
              }}
              className={passwordErrors.length ? "input-error" : ""}
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
                fontSize: "18px",
                color: "#555",
              }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              👁
            </span>
          </div>

          {/* PASSWORD RULE FEEDBACK */}
          { passwordErrors.length > 0 && (
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
          {isSignIn ? "New admin?" : "Already have an account?"}{" "}
          <span onClick={() => setIsSignIn(!isSignIn)}>
            {isSignIn ? "Create an account" : "Sign in"}
          </span>
        </p>

        {isSignIn && (
          <p
            style={{
              marginTop: "10px",
              textAlign: "center",
              color: "#6a5acd",
              cursor: "pointer",
            }}
            onClick={handleForgotPassword}
          >
            Forgot password?
          </p>
        )}
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}
