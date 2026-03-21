import React from "react";
import { useNavigate } from "react-router-dom";
import { useVolunteer } from "./VolunteerContext";

export default function VolunteerProfile() {
  const { volunteer } = useVolunteer();
  const navigate = useNavigate();

  if (!volunteer) {
    navigate("/");
    return null;
  }

  const handleLogout = async () => {
    const { data, error } = await supabase.auth.signOut();
    navigate("/"); // redirect to cover page after logout
  };

  return (
    <div className="volunteer-profile" style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "15px", padding: "10px" }}>
      <div className="profile-info" style={{ textAlign: "right" }}>
        <span className="profile-name" style={{ display: "block", fontWeight: "bold" }}>{volunteer.name}</span>
        <span className="profile-email" style={{ display: "block", fontSize: "0.9em" }}>{volunteer.email}</span>
        {volunteer.phone && <span className="profile-phone" style={{ display: "block", fontSize: "0.85em", color: "#666" }}>{volunteer.phone}</span>}
      </div>
      <button className="logout-btn" onClick={handleLogout} style={{ padding: "5px 12px", cursor: "pointer" }}>
        Logout
      </button>
    </div>
  );
}
