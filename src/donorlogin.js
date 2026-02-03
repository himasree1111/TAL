// src/DonorLogin.js
{/*}
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import supabase from "./supabaseClient";
import "./studentlogin.css";

export default function DonorLogin() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ---------------- VALIDATIONS ---------------- 

  const validateName = (value) => {
    if (!value.trim()) return "Full name is required";
    if (!/^[A-Za-z\s]+$/.test(value))
      return "Only letters and spaces are allowed";
    return "";
  };

  const validateEmail = (value) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return "Please enter a valid email address";
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

  // ---------------- RESET SESSION ---------------- 

  useEffect(() => {
    const resetSession = async () => {
      await supabase.auth.signOut();
      setLoading(false);
    };
    resetSession();
  }, []);

  // ---------------- SUBMIT ---------------- 

  const handleSubmit = async (e) => {
    e.preventDefault();

    const eErr = validateEmail(email);
    setEmailError(eErr);

    let nErr = "";
    if (!isSignIn) {
      nErr = validateName(name);
      setNameError(nErr);
    }

    const pwdErrs = validatePassword(password);
    setPasswordErrors(pwdErrs);

    if (eErr || nErr || pwdErrs.length > 0) {
      toast.error("Please fix the highlighted errors");
      return;
    }

    try {
      if (isSignIn) {
        const { data, error } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (error) throw error;

        if (data.user.user_metadata?.user_type !== "donor") {
          await supabase.auth.signOut();
          toast.error("Access denied. Use Donor login only.");
          return;
        }

        toast.success("Donor login successful 🎉");
        navigate("/donor-dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, user_type: "donor" },
          },
        });

        if (error) throw error;

        toast.success("Donor account created 🎉");
        setIsSignIn(true);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ---------------- FORGOT PASSWORD ---------------- 

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });

    if (error) toast.error(error.message);
    else toast.success("Password reset email sent 📧");
  };

  if (loading) return <div>Loading...</div>;

  // ---------------- UI ---------------- 

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>{isSignIn ? "Donor Sign In" : "Donor Sign Up"}</h1>

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

          // EMAIL 
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

          //PASSWORD WITH EYE ICON 
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
              className={passwordErrors.length ? "input-error" : ""}
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
                userSelect: "none",
              }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "👁‍🗨" : "👁"}
            </span>
          </div>

          // PASSWORD RULES 
          { passwordErrors.length > 0 && (
            <ul className="error-text">
              {passwordErrors.map((err, i) => (
                <li key={i}>{err}</li>
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
            className="forgot-password"
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
*/}