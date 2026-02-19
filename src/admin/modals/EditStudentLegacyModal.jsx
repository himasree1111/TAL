import React from "react";

export default function EditStudentLegacyModal({ editStudent, setEditStudent, handleEditSave }) {
  if (!editStudent) return null;

  return (
    <div className="modal-overlay" onClick={() => setEditStudent(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Student</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const updated = {
            id: editStudent.id,
            name: fd.get("name"),
            college: fd.get("college"),
            year: fd.get("year"),
            donor: fd.get("donor"),
            feeStatus: fd.get("feeStatus"),
            course: fd.get("course"),
            campName: fd.get("campName"),
            campDate: fd.get("campDate"),
            paidDate: fd.get("paidDate") || "",
          };
          handleEditSave(updated);
        }}>
          <label>Name<input name="name" defaultValue={editStudent.name} /></label>
          <label>College<input name="college" defaultValue={editStudent.college} /></label>
          <label>Year<input name="year" defaultValue={editStudent.year} /></label>
          <label>Donor<input name="donor" defaultValue={editStudent.donor} /></label>
          <label>Course<input name="course" defaultValue={editStudent.course || ""} placeholder="e.g. Science, Commerce" /></label>
          <label>Camp Name<input name="campName" defaultValue={editStudent.campName || ""} /></label>
          <label>Camp Date<input name="campDate" defaultValue={editStudent.campDate || ""} placeholder="YYYY-MM-DD" /></label>
          <label>Paid Date<input name="paidDate" defaultValue={editStudent.paidDate || ""} placeholder="YYYY-MM-DD" /></label>
          <label>Fee Status
            <select name="feeStatus" defaultValue={editStudent.feeStatus}>
              <option>Paid</option>
              <option>Partial</option>
              <option>Pending</option>
            </select>
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn" type="submit">Save</button>
            <button className="btn" type="button" onClick={() => setEditStudent(null)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
