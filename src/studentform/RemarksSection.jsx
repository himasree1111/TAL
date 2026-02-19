import React from "react";

export default function RemarksSection({ formData, handleInputChange }) {
  return (
    <div className="section">
      <h2>6. Special Remarks</h2>
      <textarea name="special_remarks" value={formData.special_remarks} onChange={handleInputChange} placeholder="Any additional notes or comments" rows={4} style={{ width: "100%" }} />
    </div>
  );
}
