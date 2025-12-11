// src/AdminLogin.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import supabase from "./supabaseClient";
import "./studentlogin.css"; // or rename to adminlogin.css if you prefer

export default function AdminLogin() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Check session on load
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (session) {
        const userType = session.user.user_metadata.user_type;

        if (userType === "admin") {
          // ✅ Correct role → navigate to dashboard
          navigate("/admin-dashboard");
        } else {
          // 🚫 Wrong role → force sign out
          await supabase.auth.signOut();
          toast.error("Unauthorized! Please use the correct login portal.");
          setLoading(false);
        }
      } else {
        // No active session → show login form
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);



  // ✅ Handle Sign In & Sign Up
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isSignIn) {
        // 🟢 Admin sign-in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        const { user } = data;
        const userType = user?.user_metadata?.user_type;

        if (userType !== "admin") {
          await supabase.auth.signOut();
          toast.error("Access denied. Please use the correct login portal.");
          return;
        }

        toast.success("Admin signed in successfully!");
        navigate("/admin-dashboard");
      } else {
        // 🟡 Admin sign-up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              user_type: "admin", // 👈 This ensures trigger inserts into admin table
            },
          },
        });
        if (error) throw error;
        toast.success("Admin account created successfully!");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ✅ Optional: Google Sign-In (only if you want Google auth for admins)
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/admin-dashboard",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>{isSignIn ? "Sign In" : "Admin Sign Up"}</h1>

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

        <div className="divider">or</div>

        <button className="google-btn" onClick={handleGoogleSignIn}>
          Continue with Google
        </button>

        <p className="switch-text">
          {isSignIn ? "New admin?" : "Already have an account?"}{" "}
          <span onClick={() => setIsSignIn(!isSignIn)}>
            {isSignIn ? "Create an account" : "Sign in"}
          </span>
        </p>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}
