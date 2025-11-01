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
        navigate("/student-dashboard");
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, [navigate]);

  if (loading) return <p>Loading...</p>;

  // ✅ Handle sign in & sign up
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isSignIn) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Signed in successfully!");
        navigate("/student-dashboard");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
        toast.success("Account created successfully!");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>{isSignIn ? "Sign In" : "Sign Up"}</h1>

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
            {isSignIn ? "Register" : "Sign in"}
          </span>
        </p>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}
