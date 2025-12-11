// src/VolunteerLogin.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import supabase from "./supabaseClient";
import "./studentlogin.css"; // you can keep same styling or rename later

export default function VolunteerLogin() {
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
        navigate("/volunteer-dashboard"); // 👈 volunteer dashboard route
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [navigate]);



  // ✅ Handle sign in & sign up
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("handleSubmit called", { email, password, isSignIn });

    try {
      if (isSignIn) {
        // VOLUNTEER SIGN-IN
        console.log("Attempting sign in...");
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        console.log("Sign in response:", { data, error });
        if (error) throw error;

        toast.success("Signed in successfully!");
        navigate("/volunteer-dashboard");
      } else {
        // VOLUNTEER SIGN-UP 👇 (important)
        console.log("Attempting sign up...");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              user_type: "volunteer", // 👈 this tells Supabase to put user in volunteers table
            },
          },
        });
        console.log("Sign up response:", { data, error });
        if (error) throw error;

        toast.success("Account created successfully!");
      }
    } catch (err) {
      console.error("Auth error:", err);
      toast.error(err.message);
    }
  };

  // ✅ Google Sign-In
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/volunteer-dashboard", // 👈 volunteer dashboard route
      },
    });
    if (error) toast.error(error.message);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>{isSignIn ? "Sign In" : "Volunteer Sign Up"}</h1>

        <form onSubmit={(e) => { console.log("Form submitted"); handleSubmit(e); }}>
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
