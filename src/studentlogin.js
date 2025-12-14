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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔹 Inline style for Forgot Password
  const forgotStyle = {
    marginTop: "10px",
    textAlign: "center",
    color: "#2563eb",
    cursor: "pointer",
    fontSize: "0.95rem",
  };

  // 🔍 Check session
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const userType = data.session.user.user_metadata?.user_type;
        if (userType === "student") {
          navigate("/student-dashboard");
        } else {
          await supabase.auth.signOut();
          toast.error("Unauthorized access");
        }
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [navigate]);

  // 🔐 Login / Signup
  const handleSubmit = async (e) => {
    e.preventDefault();

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

        toast.success("Login successful");
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

        toast.success("Account created successfully");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  // 🔑 Forgot Password
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

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>{isSignIn ? "Sign In" : "Student Sign Up"}</h1>

        <form onSubmit={handleSubmit}>
          {!isSignIn && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

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

        {/* 🔐 FORGOT PASSWORD */}
        {isSignIn && (
          <p style={forgotStyle} onClick={handleForgotPassword}
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
