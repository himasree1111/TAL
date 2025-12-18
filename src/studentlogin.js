// src/StudentLogin.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import supabase from "./supabaseClient";
import "./studentlogin.css";

export default function StudentLogin() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* ---------------- VALIDATIONS ---------------- */

  const validateName = (value) => {
    if (!value.trim()) return "Full name is required";
    if (!/^[A-Za-z\s]+$/.test(value))
      return "Name can contain only letters and spaces";
    if (value.trim().length < 2)
      return "Name must be at least 2 characters";
    return "";
  };

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

  /* ---------------- SESSION CHECK ---------------- */

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.user_metadata?.user_type === "student") {
        navigate("/student-dashboard");
      }
      setLoading(false);
    };
    checkSession();
  }, [navigate]);

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nError = !isSignIn ? validateName(name) : "";
    const eError = validateEmail(email);
    const pErrors = validatePassword(password);

    setNameError(nError);
    setEmailError(eError);
    setPasswordErrors(pErrors);

    if (nError || eError || pErrors.length > 0) {
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

        if (data.user.user_metadata.user_type !== "student") {
          await supabase.auth.signOut();
          toast.error("Access denied");
          return;
        }

        toast.success("Login successful 🎉");
        navigate("/student-dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              user_type: "student",
            },
          },
        });
        if (error) throw error;

        toast.success("Account created successfully 🎉");
        setIsSignIn(true);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  /* ---------------- FORGOT PASSWORD ---------------- */

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

  /* ---------------- UI ---------------- */

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>{isSignIn ? "Student Sign In" : "Student Sign Up"}</h1>

        <form onSubmit={handleSubmit}>
          {/* NAME */}
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
              {nameError && <p className="error-text">{nameError}</p>}
            </>
          )}

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
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "👁‍🗨" : "👁"}
            </span>
          </div>

          {/* PASSWORD ERRORS */}
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
              color: "#2563eb",
              cursor: "pointer",
            }}
            onMouseOver={(e) => (e.target.style.textDecoration = "underline")}
            onMouseOut={(e) => (e.target.style.textDecoration = "none")}
          >
            Forgot password?
          </p>
        )}
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}
