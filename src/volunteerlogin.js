import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "./supabaseClient";

export default function VolunteerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase
        .from("volunteers")
        .select("*")
        .eq("email", email)
        .eq("password", password);

      if (error) throw error;

      if (data && data.length > 0) {
        alert("Login successful ✅");
        localStorage.setItem("volunteerProfile", JSON.stringify(data[0]));
        navigate("/studentform");
      } else {
        alert("Invalid email or password ❌");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  // Handle Registration
  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const { data: existingUser } = await supabase
        .from("volunteers")
        .select("*")
        .eq("email", email);

      if (existingUser && existingUser.length > 0) {
        alert("Email already exists. Please login instead.");
        setIsRegistering(false);
        return;
      }

      const { data, error } = await supabase
        .from("volunteers")
        .insert([{ name, email, password }])
        .select();

      if (error) throw error;

      alert("Registration successful ✅ Please login now.");
      setIsRegistering(false);
      setEmail("");
      setPassword("");
      setName("");
    } catch (err) {
      console.error("Registration error:", err);
      alert("Something went wrong while registering.");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to bottom right, #c8e0ff, #f2f7ff)",
      }}
    >
      <div
        style={{
          width: "360px",
          padding: "25px 20px",
          borderRadius: "12px",
          backgroundColor: "#fff",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "18px",
            color: "#333",
            fontSize: "1.4rem",
          }}
        >
          {isRegistering ? "Volunteer Register" : "Volunteer Login"}
        </h2>

        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          {isRegistering && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "9px",
                marginBottom: "12px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "0.95rem",
              }}
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "9px",
              marginBottom: "12px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "0.95rem",
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "9px",
              marginBottom: "18px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "0.95rem",
            }}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              backgroundColor: "#4a90e2",
              color: "#fff",
              padding: "10px",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1rem",
            }}
          >
            {isRegistering ? "Register" : "Login"}
          </button>
        </form>

        <p
          style={{
            textAlign: "center",
            marginTop: "14px",
            fontSize: "0.9rem",
            color: "#555",
          }}
        >
          {isRegistering ? (
            <>
              Already have an account?{" "}
              <span
                onClick={() => setIsRegistering(false)}
                style={{
                  color: "#007bff",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Login
              </span>
            </>
          ) : (
            <>
              Don’t have an account?{" "}
              <span
                onClick={() => setIsRegistering(true)}
                style={{
                  color: "#007bff",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Register
              </span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}