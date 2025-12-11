// src/DonorLogin.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import supabase from "./supabaseClient";
import "./studentlogin.css"; // same styles (optional rename)

export default function DonorLogin() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ Always clear previous session when page opens
  useEffect(() => {
    const resetSession = async () => {
      await supabase.auth.signOut();
      setLoading(false);
    };
    resetSession();
  }, []);

 

  // ✅ Handle sign in / sign up
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isSignIn) {
        // Donor sign-in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        const { user } = data;
        const userType = user?.user_metadata?.user_type;

        if (userType !== "donor") {
          await supabase.auth.signOut();
          toast.error("Access denied! Please log in via the donor portal only.");
          return;
        }

        toast.success("Donor signed in successfully!");
        navigate("/donor-dashboard");
      } else {
        // Donor sign-up
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              user_type: "donor", // 👈 Important metadata
            },
          },
        });
        if (error) throw error;

        toast.success("Donor account created successfully!");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ✅ Optional: Google Sign-In
  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/donor-dashboard",
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>{isSignIn ? "Sign In" : "Donor Sign Up"}</h1>

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
