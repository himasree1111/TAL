import React from "react";
import "./loginProfiles.css";

const profiles = [
  { role: "Student", description: "Access courses and resources" },
  { role: "Donor", description: "Support causes and projects" },
  { role: "Volunteer", description: "Help organize and assist" },
  { role: "Admin", description: "Manage the entire platform" },
];

export default function ProfilesPage() {
  const handleClick = (role) => {
    alert(`Selected: ${role}`);
    // navigate(`/login/${role.toLowerCase()}`);
  };

  return (
    <div className="profiles-wrapper">
      <div className="profiles-header">
        <p className="subtitle">Choose Your Role</p>
        <h1>
          Start Your Journey <span>With Us</span>
        </h1>
      </div>

      <div className="profiles-grid">
        {profiles.map((profile, index) => (
          <div
            key={profile.role}
            className={`profile-card color-${index + 1}`}
            onClick={() => handleClick(profile.role)}
          >
            <div className="circle-wrapper">
              <div className="circle-icon">{profile.role.charAt(0)}</div>
            </div>
            <h2>{profile.role}</h2>
            <p>{profile.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
