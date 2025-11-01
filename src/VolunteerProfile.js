import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "./supabaseClient";

export default function VolunteerProfile() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      console.log("Supabase user session:", user); // Debug: see user session
      console.log("Error (if any):", error);

      if (user) {
        setName(user.user_metadata?.full_name || "Volunteer");
        setEmail(user.email || "");
      } else {
        console.log("No logged-in user detected. Redirecting to /cover");
        navigate("/cover"); // redirect if no user
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.log("Logout error:", error);
    else console.log("Logged out successfully");

    navigate("/CoverPage"); // redirect to cover page after logout
  };

  return (
    <div className="volunteer-profile" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "15px", padding: "10px" }}>
      <div className="profile-info" style={{ textAlign: "right" }}>
        <span className="profile-name" style={{ display: "block", fontWeight: "bold" }}>{name}</span>
        <span className="profile-email" style={{ display: "block", fontSize: "0.9em" }}>{email}</span>
      </div>
      <button className="logout-btn" onClick={handleLogout} style={{ padding: "5px 12px", cursor: "pointer" }}>
        Logout
      </button>
    </div>
  );
}
