import React from "react";

export default function ViewDonorModal({ viewDonor, setViewDonor, handleContactDonor }) {
  if (!viewDonor) return null;

  return (
    <div className="modal-overlay" onClick={() => setViewDonor(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Donor Details</h3>
        <p><strong>Name:</strong> {viewDonor.name}</p>
        <p><strong>Amount:</strong> {"\u20B9"}{viewDonor.amount}</p>
        <p><strong>Duration:</strong> {viewDonor.years}</p>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn" onClick={() => setViewDonor(null)}>Close</button>
          <button className="btn" onClick={() => handleContactDonor(viewDonor)}>Contact</button>
        </div>
      </div>
    </div>
  );
}
