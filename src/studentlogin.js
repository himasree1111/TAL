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

  // ✅ Check session on load
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const userType = data.session.user.user_metadata.user_type;
        if (userType === "student") {
          navigate("/student-dashboard");
        } else {
          // Sign out invalid users automatically
          await supabase.auth.signOut();
          toast.error("Unauthorized! Please log in through the correct portal.");
        }
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [navigate]);

 

  // ✅ Handle sign in & sign up
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isSignIn) {
        // Step 1: Attempt sign-in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // Step 2: Check user type immediately
        const { user } = data;
        const userType = user?.user_metadata?.user_type;

        if (userType !== "student") {
          // 🚫 If not a student, reject login
          await supabase.auth.signOut();
          toast.error("Access denied. Please login with proper login.");
          return;
        }

        toast.success("Student signed in successfully!");
        navigate("/student-dashboard");
      } else {
        // Student Sign-Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              user_type: "student", // 👈 Set role explicitly
            },
          },
        });
        if (error) throw error;
        toast.success("Student account created successfully!");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ✅ Google Sign-In (optional)
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/student-dashboard",
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

          <button type="submit">{isSignIn ? "Sign In" : "Sign Up"}</button>
        </form>

        <div className="divider">or</div>


        <p className="switch-text">
          {isSignIn ? "New here?" : "Already have an account?"}{" "}
          <span onClick={() => setIsSignIn(!isSignIn)}>
            {isSignIn ? "Create an account" : "Sign in"}
          </span>
        </p>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}
