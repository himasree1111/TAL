import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function DonorLogin({ setDonorLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Mock donor credentials
    const mockDonor = { email: "donor@example.com", password: "donor123" };

    if (email === mockDonor.email && password === mockDonor.password) {
      setError("");
      setDonorLoggedIn(true);        // mark donor as logged in
      navigate("/donor/dashboard");  // redirect to dashboard
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <form onSubmit={handleSubmit} style={{ maxWidth: "400px", width: "100%" }}>
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Donor Login</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem", borderRadius: "0.5rem", border: "1px solid #ccc" }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ width: "100%", padding: "0.75rem", marginBottom: "1rem", borderRadius: "0.5rem", border: "1px solid #ccc" }}
        />

        <button type="submit" style={{ width: "100%", padding: "0.75rem", background: "#2196F3", color: "white", borderRadius: "0.5rem" }}>
          Login
        </button>

        {error && <p style={{ color: "red", marginTop: "1rem", textAlign: "center" }}>{error}</p>}
      </form>
    </div>
  );
}

export default DonorLogin;