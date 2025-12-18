// src/AdminLogin.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import supabase from "./supabaseClient";
import "react-toastify/dist/ReactToastify.css";
import "./studentlogin.css";

export default function AdminLogin() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const navigate = useNavigate();

  // ✅ Validation functions
  const validateName = (value) => {
    if (!value.trim()) {
      return "❌ Full name is required";
    }
    const regex = /^[a-zA-Z\s]+$/;
    if (!regex.test(value)) {
      return "❌ Full name must contain only letters and spaces";
    }
    if (value.trim().length < 2) {
      return "❌ Full name must be at least 2 characters long";
    }
    return "";
  };

  const validateEmail = (value) => {
    const regex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(value)) {
      return "❌ Wrong email format (example: name@example.com)";
    }
    return "";
  };

  const validatePassword = (value) => {
    const errors = [];
    if (!/[a-z]/.test(value)) errors.push("❌ Must include a lowercase letter");
    if (!/[A-Z]/.test(value)) errors.push("❌ Must include an uppercase letter");
    if (!/[0-9]/.test(value)) errors.push("❌ Must include a number");
    if (!/[@$!%*?&]/.test(value)) errors.push("❌ Must include a special character (@$!%*?&)");
    if (value.length < 8) errors.push("❌ Must be at least 8 characters long");
    return errors;
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.user_metadata?.user_type === "admin") {
        navigate("/admin-dashboard");
      }
    };
    checkSession();
  }, [navigate]);

  useEffect(() => {
    setErrors({});
    setTouched({ name: false, email: false, password: false });
  }, [isSignIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (isSignIn) {
      const emailErr = validateEmail(email);
      if (emailErr) newErrors.email = emailErr;
      if (!password) newErrors.password = "Password is required";
    } else {
      const nameErr = validateName(name);
      if (nameErr) newErrors.name = nameErr;
      const emailErr = validateEmail(email);
      if (emailErr) newErrors.email = emailErr;
      const passErrs = validatePassword(password);
      if (passErrs.length > 0) newErrors.password = passErrs;
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

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

        toast.success("Admin logged in!");
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
        toast.success("Admin account created!");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });

    if (error) toast.error(error.message);
    else toast.success("Password reset email sent");
  };

  // ✅ Inline style (replaces CSS)
  const forgotPasswordStyle = {
    marginTop: "10px",
    textAlign: "center",
    color: "#6a5acd",
    cursor: "pointer",
    fontSize: "0.95rem",
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>{isSignIn ? "Sign In" : "Sign Up"}</h1>

        <form onSubmit={handleSubmit}>
          {!isSignIn && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (touched.name) {
                    setErrors({ ...errors, name: validateName(e.target.value) });
                  }
                }}
                onBlur={() => {
                  setTouched({ ...touched, name: true });
                  setErrors({ ...errors, name: validateName(name) });
                }}
                className={errors.name ? "input-error" : ""}
                required
              />
              {errors.name && (
                <p className="error-text">{errors.name}</p>
              )}
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (touched.email) {
                setErrors({ ...errors, email: validateEmail(e.target.value) });
              }
            }}
            onBlur={() => {
              setTouched({ ...touched, email: true });
              setErrors({ ...errors, email: validateEmail(email) });
            }}
            className={errors.email ? "input-error" : ""}
            required
          />
          {errors.email && (
            <p className="error-text">{errors.email}</p>
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (touched.password) {
                setErrors({ ...errors, password: validatePassword(e.target.value) });
              }
            }}
            onBlur={() => {
              setTouched({ ...touched, password: true });
              setErrors({ ...errors, password: validatePassword(password) });
            }}
            className={errors.password ? "input-error" : ""}
            required
          />
          {errors.password && (
            <ul className="error-text">
              {errors.password.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          )}

          <button
            type="submit"
            disabled={
              isSignIn
                ? !email || !password
                : !name || !email || !password
            }
          >
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
            style={forgotPasswordStyle}
            onClick={handleForgotPassword}
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
