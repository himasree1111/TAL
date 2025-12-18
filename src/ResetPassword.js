import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import supabase from "./supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role");

  useEffect(() => {
    const init = async () => {
      try {
        if (
          window.location.href.includes("access_token") ||
          window.location.href.includes("refresh_token") ||
          window.location.href.includes("type=recovery")
        ) {
          await supabase.auth.exchangeCodeForSession(window.location.href);
        }

        const { data } = await supabase.auth.getSession();
        setHasSession(!!data.session);
      } catch (err) {
        console.error(err);
        toast.error("Failed to verify reset link");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success("Password updated successfully!");

      await supabase.auth.signOut();

      setTimeout(() => {
        if (role === "admin") {
          navigate("/adminlogin");
        } else {
          navigate("/volunteerlogin");
        }
      }, 1500);
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ color: "white", textAlign: "center", marginTop: "100px" }}>
        Verifying reset link...
        <ToastContainer />
      </div>
    );
  }

  return (
    <div style={{ color: "Black", textAlign: "center", marginTop: "100px" }}>
      <h1>Reset Password</h1>
      

      {!hasSession && (
        <p style={{ color: "Red" }}>
           Please use reset link from email.
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br /><br />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <br /><br />

        <button type="submit">Update Password</button>
      </form>

      <ToastContainer position="top-center" />
    </div>
  );
}
