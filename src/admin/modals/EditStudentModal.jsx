import React from "react";

export default function EditStudentModal({ editStudentModal, setEditStudentModal, handleEditStudentSave }) {
  if (!editStudentModal) return null;

  return (
    <div className="modal-overlay" onClick={() => setEditStudentModal(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "80vh", overflowY: "auto" }}>
        <h3>Edit Student (ID: {editStudentModal.id})</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <label>First Name<input value={editStudentModal.first_name} onChange={(e) => setEditStudentModal((f) => ({ ...f, first_name: e.target.value }))} /></label>
          <label>Last Name<input value={editStudentModal.last_name} onChange={(e) => setEditStudentModal((f) => ({ ...f, last_name: e.target.value }))} /></label>
          <label>Email<input type="email" value={editStudentModal.email} onChange={(e) => setEditStudentModal((f) => ({ ...f, email: e.target.value }))} /></label>
          <label>Contact<input value={editStudentModal.contact} onChange={(e) => setEditStudentModal((f) => ({ ...f, contact: e.target.value }))} /></label>
          <label>School/College<input value={editStudentModal.school} onChange={(e) => setEditStudentModal((f) => ({ ...f, school: e.target.value }))} /></label>
          <label>Class/Year<input value={editStudentModal.class} onChange={(e) => setEditStudentModal((f) => ({ ...f, class: e.target.value }))} /></label>
          <label>Education Category<input value={editStudentModal.educationcategory} onChange={(e) => setEditStudentModal((f) => ({ ...f, educationcategory: e.target.value }))} /></label>
          <label>Fee Structure<input value={editStudentModal.fee_structure} onChange={(e) => setEditStudentModal((f) => ({ ...f, fee_structure: e.target.value }))} /></label>
          <label>Address<input value={editStudentModal.address} onChange={(e) => setEditStudentModal((f) => ({ ...f, address: e.target.value }))} /></label>
          <label>Father's Name<input value={editStudentModal.father_name || ""} onChange={(e) => setEditStudentModal((f) => ({ ...f, father_name: e.target.value }))} /></label>
          <label>Mother's Name<input value={editStudentModal.mother_name || ""} onChange={(e) => setEditStudentModal((f) => ({ ...f, mother_name: e.target.value }))} /></label>
          <label>Guardian's Name<input value={editStudentModal.guardian_name || ""} onChange={(e) => setEditStudentModal((f) => ({ ...f, guardian_name: e.target.value }))} /></label>
          <label>Head of Family<input value={editStudentModal.head_of_family || ""} onChange={(e) => setEditStudentModal((f) => ({ ...f, head_of_family: e.target.value }))} /></label>
          <label>Income Source<input value={editStudentModal.income_source || ""} onChange={(e) => setEditStudentModal((f) => ({ ...f, income_source: e.target.value }))} /></label>
          <label>Monthly Income<input type="number" value={editStudentModal.monthly_income || ""} onChange={(e) => setEditStudentModal((f) => ({ ...f, monthly_income: e.target.value }))} /></label>
          <label>No. of Dependents<input type="number" value={editStudentModal.num_dependents || ""} onChange={(e) => setEditStudentModal((f) => ({ ...f, num_dependents: e.target.value }))} /></label>
          <label>School Address<input value={editStudentModal.school_address || ""} onChange={(e) => setEditStudentModal((f) => ({ ...f, school_address: e.target.value }))} /></label>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button className="btn primary" onClick={handleEditStudentSave}>Save Changes</button>
          <button className="btn" onClick={() => setEditStudentModal(null)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
