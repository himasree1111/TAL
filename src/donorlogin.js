// src/DonorLogin.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import supabase from "./supabaseClient";
import "./studentlogin.css"; // SAME color/style as Volunteer

export default function DonorLogin() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  /* ---------------- VALIDATION ---------------- */

  const validateEmail = (email) => {
    if (!email) return "Email is required";
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) return "Invalid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8)
      return "Password must be at least 8 characters";
    return "";
  };

  const validateName = (name) => {
    if (!name) return "Full name is required";
    if (name.trim().length < 2)
      return "Name must be at least 2 characters";
    return "";
  };

  /* ---------------- RESET SESSION ---------------- */

  useEffect(() => {
    const resetSession = async () => {
      await supabase.auth.signOut();
      setLoading(false);
    };
    resetSession();
  }, []);

  /* ---------------- SIGN IN / SIGN UP ---------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (isSignIn) {
      const emailError = validateEmail(email);
      if (emailError) newErrors.email = emailError;
      if (!password) newErrors.password = "Password required";
    } else {
      const nameError = validateName(name);
      if (nameError) newErrors.name = nameError;
      const emailError = validateEmail(email);
      if (emailError) newErrors.email = emailError;
      const passError = validatePassword(password);
      if (passError) newErrors.password = passError;
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

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

        toast.success("Donor login successful!");
        navigate("/donor-dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              user_type: "donor",
            },
          },
        });
        if (error) throw error;
        toast.success("Donor account created!");
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

    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo:
          window.location.origin + "/reset-password",
      }
    );

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password reset email sent!");
    }
  };

  /* ---------------- GOOGLE SIGN IN ---------------- */

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          window.location.origin + "/donor-dashboard",
      },
    });
    if (error) toast.error(error.message);
  };

  if (loading) return <div>Loading...</div>;

  /* ---------------- UI ---------------- */

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>{isSignIn ? "Sign In" : "Donor Sign Up"}</h1>

        <form onSubmit={handleSubmit}>
          {!isSignIn && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={errors.name ? "input-error" : ""}
              />
              {errors.name && (
                <p className="error-text">{errors.name}</p>
              )}
            </>
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={errors.email ? "input-error" : ""}
          />
          {errors.email && (
            <p className="error-text">{errors.email}</p>
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={errors.password ? "input-error" : ""}
          />
          {errors.password && (
            <p className="error-text">{errors.password}</p>
          )}

          <button type="submit">
            {isSignIn ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="divider">or</div>


        <p className="switch-text">
          {isSignIn ? "New here?" : "Already have an account?"}{" "}
          <span onClick={() => setIsSignIn(!isSignIn)}>
            {isSignIn ? "Create an account" : "Sign in"}
          </span>
        </p>

        {/* ✅ FORGOT PASSWORD BELOW CREATE ACCOUNT */}
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
