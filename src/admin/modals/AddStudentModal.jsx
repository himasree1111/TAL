import React from "react";

export default function AddStudentModal({ addStudentForm, setAddStudentForm, setShowAddStudentModal, handleAddStudent }) {
  return (
    <div className="modal-overlay" onClick={() => setShowAddStudentModal(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "80vh", overflowY: "auto" }}>
        <h3>Add New Student</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <label>First Name *<input value={addStudentForm.first_name} onChange={(e) => setAddStudentForm((f) => ({ ...f, first_name: e.target.value }))} /></label>
          <label>Last Name *<input value={addStudentForm.last_name} onChange={(e) => setAddStudentForm((f) => ({ ...f, last_name: e.target.value }))} /></label>
          <label>Email *<input type="email" value={addStudentForm.email} onChange={(e) => setAddStudentForm((f) => ({ ...f, email: e.target.value }))} /></label>
          <label>Contact<input value={addStudentForm.contact} onChange={(e) => setAddStudentForm((f) => ({ ...f, contact: e.target.value }))} /></label>
          <label>WhatsApp<input value={addStudentForm.whatsapp} onChange={(e) => setAddStudentForm((f) => ({ ...f, whatsapp: e.target.value }))} /></label>
          <label>Date of Birth<input type="date" value={addStudentForm.dob} onChange={(e) => setAddStudentForm((f) => ({ ...f, dob: e.target.value }))} /></label>
          <label>Age<input type="number" value={addStudentForm.age} onChange={(e) => setAddStudentForm((f) => ({ ...f, age: e.target.value }))} /></label>
          <label>School/College<input value={addStudentForm.school} onChange={(e) => setAddStudentForm((f) => ({ ...f, school: e.target.value }))} /></label>
          <label>Class/Year<input value={addStudentForm.class} onChange={(e) => setAddStudentForm((f) => ({ ...f, class: e.target.value }))} /></label>
          <label>Education Category<input value={addStudentForm.educationcategory} onChange={(e) => setAddStudentForm((f) => ({ ...f, educationcategory: e.target.value }))} /></label>
          <label>Branch<input value={addStudentForm.branch} onChange={(e) => setAddStudentForm((f) => ({ ...f, branch: e.target.value }))} /></label>
          <label>Address<input value={addStudentForm.address} onChange={(e) => setAddStudentForm((f) => ({ ...f, address: e.target.value }))} /></label>
          <label>Camp Name<input value={addStudentForm.camp_name} onChange={(e) => setAddStudentForm((f) => ({ ...f, camp_name: e.target.value }))} /></label>
          <label>Fee Structure<input value={addStudentForm.fee_structure} onChange={(e) => setAddStudentForm((f) => ({ ...f, fee_structure: e.target.value }))} /></label>
          <label>Prev %<input value={addStudentForm.prev_percent} onChange={(e) => setAddStudentForm((f) => ({ ...f, prev_percent: e.target.value }))} /></label>
          <label>Present %<input value={addStudentForm.present_percent} onChange={(e) => setAddStudentForm((f) => ({ ...f, present_percent: e.target.value }))} /></label>
          <label>Father's Name<input value={addStudentForm.father_name} onChange={(e) => setAddStudentForm((f) => ({ ...f, father_name: e.target.value }))} /></label>
          <label>Mother's Name<input value={addStudentForm.mother_name} onChange={(e) => setAddStudentForm((f) => ({ ...f, mother_name: e.target.value }))} /></label>
          <label>Guardian's Name<input value={addStudentForm.guardian_name} onChange={(e) => setAddStudentForm((f) => ({ ...f, guardian_name: e.target.value }))} /></label>
          <label>Head of Family<input value={addStudentForm.head_of_family} onChange={(e) => setAddStudentForm((f) => ({ ...f, head_of_family: e.target.value }))} /></label>
          <label>Income Source<input value={addStudentForm.income_source} onChange={(e) => setAddStudentForm((f) => ({ ...f, income_source: e.target.value }))} /></label>
          <label>Monthly Income<input type="number" value={addStudentForm.monthly_income} onChange={(e) => setAddStudentForm((f) => ({ ...f, monthly_income: e.target.value }))} /></label>
          <label>No. of Dependents<input type="number" value={addStudentForm.num_dependents} onChange={(e) => setAddStudentForm((f) => ({ ...f, num_dependents: e.target.value }))} /></label>
          <label>School Address<input value={addStudentForm.school_address} onChange={(e) => setAddStudentForm((f) => ({ ...f, school_address: e.target.value }))} /></label>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button className="btn primary" onClick={handleAddStudent}>Add Student</button>
          <button className="btn" onClick={() => setShowAddStudentModal(false)}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
