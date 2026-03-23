// src/donorlogin.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import supabase from "./supabaseClient";
import "./studentlogin.css";

export default function DonorLogin() {
  const [isSignIn, setIsSignIn] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const validateName = (value) => {
    if (!value.trim()) return "Full name is required";
    if (!/^[A-Za-z\s]+$/.test(value)) return "Name can contain only letters and spaces";
    if (value.trim().length < 2) return "Name must be at least 2 characters";
    return "";
  };

  const validatePhone = (value) => {
    if (!value) return "Phone number is required";
    if (!/^\d{10}$/.test(value)) return "Must be exactly 10 digits";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isSignIn) {
      const nameErr = validateName(name);
      const phoneErr = validatePhone(phone);
      setNameError(nameErr);
      setPhoneError(phoneErr);
      if (nameErr || phoneErr) {
        toast.error("Fix name and/or phone fields");
        return;
      }
    }

    try {
      if (isSignIn) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        const { data } = await supabase.auth.getSession();
        if (data.session?.user?.user_metadata?.user_type !== "donor") {
          await supabase.auth.signOut();
          toast.error("Unauthorized access");
          return;
        }

        toast.success("Donor login successful 🎉");
        navigate("/donor-dashboard");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, phone, user_type: "donor" },
          },
        });
        if (error) throw error;

        toast.success("Donor account created 🎉");
        setIsSignIn(true);
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.user_metadata?.user_type === "donor") {
        navigate("/donor-dashboard");
      }
      setLoading(false);
    };
    checkSession();
  }, [navigate]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>{isSignIn ? "Donor Sign In" : "Donor Sign Up"}</h1>

        <form onSubmit={handleSubmit}>
          {!isSignIn && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(validateName(e.target.value));
                }}
                required
              />
              {nameError && <p className="error-text">{nameError}</p>}

              <input
                type="tel"
                placeholder="Phone Number (10 digits)"
                value={phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0,10);
                  setPhone(value);
                  setPhoneError(validatePhone(value));
                }}
                maxLength={10}
                required
              />
              {phoneError && <p className="error-text">{phoneError}</p>}
            </>
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ paddingRight: "40px" }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#555",
                fontSize: "18px",
              }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "👁‍🗨" : "👁"}
            </span>
          </div>

          <button type="submit">
            {isSignIn ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <p className="switch-text">
          {isSignIn ? "New donor?" : "Already have an account?"}{" "}
          <span onClick={() => setIsSignIn(!isSignIn)}>
            {isSignIn ? "Create an account" : "Sign in"}
          </span>
        </p>
      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}

