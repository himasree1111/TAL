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
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.user_metadata?.user_type === "volunteer") {
        navigate("/volunteer-dashboard");
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowErrors(true);

    const emailError = email.trim() === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 'Invalid email format' : '';
    const nameError = !isSignIn && name.trim() === '' ? 'Full name is required' : '';
    const phoneError = !isSignIn && phone.trim() === '' ? 'Phone number required' : (!isSignIn && !/^\d{10}$/.test(phone.trim()) ? '10 digits only' : '');
    const pwdErrors = password ? validatePassword(password) : [];

    if (emailError || nameError || phoneError || pwdErrors.length > 0) {
      toast.error("Fix highlighted fields");
      return;
    }

    try {
      if (isSignIn) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;

        if (data.user.user_metadata.user_type !== "volunteer") {
          await supabase.auth.signOut();
          toast.error("Unauthorized");
          return;
        }

        toast.success("Login successful");
        navigate("/volunteer-dashboard");
      } else {
        const { data: userData, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: { name: name.trim(), phone: phone.trim(), user_type: "volunteer" },
          },
        });
        if (error) throw error;

        // Insert profile
        const profileData = {
          id: userData.user.id,
          full_name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
        };
        await supabase.from('profiles_volunteers').insert([profileData]);

        toast.success("Account created!");
        setIsSignIn(true);
        setShowErrors(false);
        setEmail("");
        setPassword("");
        setName("");
        setPhone("");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (value) => {
    const errors = [];
    if (!/[a-z]/.test(value)) errors.push("Lowercase letter required");
    if (!/[A-Z]/.test(value)) errors.push("Uppercase letter required");
    if (!/[0-9]/.test(value)) errors.push("Number required");
    if (!/[@$!%*?&]/.test(value)) errors.push("Special character required");
    if (value.length < 8) errors.push("Minimum 8 characters");
    return errors;
  };

  // Errors shown only after submit
  const emailErrorMsg = showErrors ? (email.trim() === '' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 'Invalid email format' : '') : '';
  const nameErrorMsg = showErrors && !isSignIn ? (name.trim() === '' ? 'Full name required' : '') : '';
  const phoneErrorMsg = showErrors && !isSignIn ? (phone.trim() === '' ? 'Phone required' : !/^\d{10}$/.test(phone.trim()) ? '10 digits only' : '') : '';
  const passwordErrorMsgs = showErrors ? validatePassword(password) : [];

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Enter email first");
      return;
    }

    const redirectUrl =
      process.env.REACT_APP_RESET_PASSWORD_URL ||
      window.location.origin + "/reset-password?role=volunteer";
    console.log("Volunteer reset redirect URL:", redirectUrl);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error("resetPasswordForEmail error:", error);
      toast.error(error.message);
    } else {
      toast.success("Reset email sent");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>{isSignIn ? "Volunteer Sign In" : "Volunteer Sign Up"}</h1>

        <form onSubmit={handleSubmit}>
          {!isSignIn && (
            <>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={nameErrorMsg ? "input-error" : ""}
              />
              {nameErrorMsg && <p className="error-text">{nameErrorMsg}</p>}

              <input
                type="tel"
                placeholder="Phone (10 digits)"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0,10))}
                maxLength="10"
                className={phoneErrorMsg ? "input-error" : ""}
              />
              {phoneErrorMsg && <p className="error-text">{phoneErrorMsg}</p>}
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={emailErrorMsg ? "input-error" : ""}
          />
          {emailErrorMsg && <p className="error-text">{emailErrorMsg}</p>}

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ paddingRight: "42px" }}
              className={passwordErrorMsgs.length > 0 ? "input-error" : ""}
            />
            <span
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "#555",
                fontSize: "18px",
              }}
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? "Hide" : "Show"}
            >
              {showPassword ? "👁" : "👁"}
            </span>
          </div>

          {passwordErrorMsgs.length > 0 && (
            <div className="password-requirements" aria-live="polite">
              <p className="password-requirements-title">Password must include</p>
              <ul className="password-requirements-list">
                {passwordErrorMsgs.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Loading..." : (isSignIn ? "Sign In" : "Sign Up")}
          </button>
        </form>

        <p className="switch-text" style={{textAlign: 'center'}}>
          {isSignIn ? "New volunteer?" : "Have account?"}{' '}
          <span onClick={() => {setIsSignIn(!isSignIn); setShowErrors(false);}} style={{ cursor: 'pointer', color: '#4F46E5' }}>
            {isSignIn ? "Sign up" : "Sign in"}
          </span>
        </p>

        {isSignIn && (
          <p className="forgot-password" onClick={handleForgotPassword} style={{textAlign: 'center', marginTop: '10px', cursor: 'pointer', color: '#666'}}>
            Forgot password?
          </p>
        )}

      </div>

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
}
