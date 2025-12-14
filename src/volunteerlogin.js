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
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔹 Inline style for forgot password
  const forgotPasswordStyle = {
    marginTop: "10px",
    textAlign: "center",
    color: "#6a5acd",
    cursor: "pointer",
    fontSize: "0.95rem",
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const userType = data.session.user.user_metadata?.user_type;
        if (userType === "volunteer") {
          navigate("/volunteer-dashboard");
        } else {
          await supabase.auth.signOut();
        }
      }
      setLoading(false);
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isSignIn) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        if (data.user.user_metadata.user_type !== "volunteer") {
          await supabase.auth.signOut();
          toast.error("Unauthorized login");
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

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset email sent 📧");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>{isSignIn ? "Sign In" : "Volunteer Sign Up"}</h1>

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

          <button type="submit">{isSignIn ? "Sign In" : "Sign Up"}</button>
        </form>

        <p className="switch-text">
          {isSignIn ? "New here?" : "Already have an account?"}{" "}
          <span onClick={() => setIsSignIn(!isSignIn)}>
            {isSignIn ? "Create an account" : "Sign in"}
          </span>
        </p>

        {/* 🔹 Forgot Password */}
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
