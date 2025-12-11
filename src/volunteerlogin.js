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
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Validation functions
  const validateEmail = (email) => {
    if (!email) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters long";
    if (password.length > 64) return "Password must be no more than 64 characters long";
    if (/\s/.test(password)) return "Password cannot contain spaces";
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])([A-Za-z\d!@#$%^&*]{8,64})$/;
    if (!passwordRegex.test(password)) {
      return "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (!@#$%^&*)";
    }
    return "";
  };

  const validateName = (name) => {
    if (!name) return "Full name is required";
    if (name.trim().length < 2) return "Full name must be at least 2 characters long";
    if (!/^[a-zA-Z\s]+$/.test(name.trim())) return "Full name can only contain alphabets and spaces";
    return "";
  };

  // Change handlers with live validation
  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    if (!isSignIn) {
      setErrors(prev => ({ ...prev, name: validateName(value) }));
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setErrors(prev => ({ ...prev, email: validateEmail(value) }));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setErrors(prev => ({ ...prev, password: validatePassword(value) }));
  };

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

    // Validate all fields before submission
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const nameError = !isSignIn ? validateName(name) : "";

    setErrors({
      email: emailError,
      password: passwordError,
      name: nameError
    });

    // If any validation errors, prevent submission
    if (emailError || passwordError || nameError) {
      return;
    }

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
            <div>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={handleNameChange}
                className={errors.name ? "input-error" : ""}
                required
              />
              {errors.name && <p className="error-text">{errors.name}</p>}
            </div>
          )}

          <div>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={handleEmailChange}
              className={errors.email ? "input-error" : ""}
              required
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              className={errors.password ? "input-error" : ""}
              required
            />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

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
