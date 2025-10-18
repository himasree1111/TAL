import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StudentForm.css"; // reuse existing styles and add enhancements

export default function VolunteerProfile() {
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const raw = localStorage.getItem("volunteerProfile");
    if (raw) {
      try {
        setProfile(JSON.parse(raw));
      } catch (e) {
        console.error("Failed to parse volunteerProfile", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("volunteerProfile");
    navigate("/volunteerlogin");
  };

  if (!profile) return null;

  // derive initials if no avatar provided
  const initials = ((profile.name || "").split(" ") || [])
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="volunteer-profile" role="region" aria-label="Volunteer profile">
      <div className="vp-left">
        {profile.photo ? (
          <img src={profile.photo} alt={`${profile.name} avatar`} className="vp-avatar" />
        ) : (
          <div className="vp-avatar vp-initials">{initials}</div>
        )}
      </div>
      <div className="vp-right">
        <div className="vp-name">{profile.name}</div>
        <div className="vp-role">{profile.role}</div>
        <div className="vp-email">{profile.email}</div>
        <div className="vp-actions">
          <button className="vp-btn vp-view" onClick={() => navigate('/volunteerprofile')}>View</button>
          <button className="vp-btn vp-logout" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
}
