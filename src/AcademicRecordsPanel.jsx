import React, { useState, useEffect, useCallback } from "react";
import supabase from "./supabaseClient";
import "./AcademicRecordsPanel.css";

export default function AcademicRecordsPanel({ studentId, readOnly = false, compact = false }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    academic_year: "", semester: "", subject_name: "",
    marks_obtained: "", max_marks: "", grade: "",
  });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("academic_records")
        .select("*")
        .eq("student_id", studentId);
      if (!error && data) setRecords(data);
    } catch (err) { /* silenced */ }
    finally { setLoading(false); }
  }, [studentId]);

  useEffect(() => {
    if (studentId) fetchRecords();
  }, [studentId, fetchRecords]);

  const grouped = records.reduce((acc, r) => {
    const key = `${r.academic_year || "Unknown"}|||${r.semester || ""}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const resetForm = () => {
    setFormData({ academic_year: "", semester: "", subject_name: "", marks_obtained: "", max_marks: "", grade: "" });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.subject_name || !formData.academic_year) return;

    const payload = {
      student_id: studentId,
      academic_year: formData.academic_year,
      semester: formData.semester || null,
      subject_name: formData.subject_name,
      marks_obtained: formData.marks_obtained ? parseFloat(formData.marks_obtained) : null,
      max_marks: formData.max_marks ? parseFloat(formData.max_marks) : null,
      grade: formData.grade || null,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("academic_records").update(payload).eq("id", editingId);
        if (error) return;
      } else {
        const { error } = await supabase.from("academic_records").insert(payload);
        if (error) return;
      }
      resetForm();
      fetchRecords();
    } catch (err) { /* silenced */ }
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    setFormData({
      academic_year: record.academic_year || "",
      semester: record.semester || "",
      subject_name: record.subject_name || "",
      marks_obtained: record.marks_obtained != null ? String(record.marks_obtained) : "",
      max_marks: record.max_marks != null ? String(record.max_marks) : "",
      grade: record.grade || "",
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      await supabase.from("academic_records").delete().eq("id", id);
      fetchRecords();
    } catch (err) { /* silenced */ }
  };

  const fontSize = compact ? "0.85em" : "1em";
  const padding = compact ? "12px" : "16px";

  return (
    <div className="academic-records-panel" style={{ fontSize, padding }}>
      <div className="arp-header">
        <h4 style={{ margin: 0 }}>Academic Records</h4>
        {!readOnly && (
          <button className="arp-btn arp-btn-primary" onClick={() => { resetForm(); setShowAddForm(!showAddForm); }}>
            {showAddForm ? "Cancel" : "+ Add Record"}
          </button>
        )}
      </div>

      {showAddForm && !readOnly && (
        <div className="arp-form">
          <div className="arp-form-grid">
            <label>
              Year *
              <input value={formData.academic_year} onChange={(e) => setFormData((f) => ({ ...f, academic_year: e.target.value }))} placeholder="e.g. 2024-2025" />
            </label>
            <label>
              Semester
              <input value={formData.semester} onChange={(e) => setFormData((f) => ({ ...f, semester: e.target.value }))} placeholder="e.g. Sem 1" />
            </label>
            <label>
              Subject *
              <input value={formData.subject_name} onChange={(e) => setFormData((f) => ({ ...f, subject_name: e.target.value }))} placeholder="Subject name" />
            </label>
            <label>
              Marks
              <input type="number" value={formData.marks_obtained} onChange={(e) => setFormData((f) => ({ ...f, marks_obtained: e.target.value }))} placeholder="0" />
            </label>
            <label>
              Max Marks
              <input type="number" value={formData.max_marks} onChange={(e) => setFormData((f) => ({ ...f, max_marks: e.target.value }))} placeholder="100" />
            </label>
            <label>
              Grade
              <input value={formData.grade} onChange={(e) => setFormData((f) => ({ ...f, grade: e.target.value }))} placeholder="e.g. A+" />
            </label>
          </div>
          <button className="arp-btn arp-btn-primary" onClick={handleSave} style={{ marginTop: "8px" }}>
            {editingId ? "Update" : "Save"}
          </button>
        </div>
      )}

      {loading ? (
        <p style={{ color: "#888", padding: "8px 0" }}>Loading...</p>
      ) : records.length === 0 ? (
        <p style={{ color: "#888", padding: "8px 0" }}>No academic records yet.</p>
      ) : (
        Object.entries(grouped).map(([key, groupRecords]) => {
          const [year, semester] = key.split("|||");
          const totalMarks = groupRecords.reduce((s, r) => s + (r.marks_obtained || 0), 0);
          const totalMax = groupRecords.reduce((s, r) => s + (r.max_marks || 0), 0);
          const percentage = totalMax > 0 ? ((totalMarks / totalMax) * 100).toFixed(1) : "N/A";

          return (
            <div key={key} className="arp-group">
              <div className="arp-group-header">
                <strong>{year}</strong>
                {semester && <span className="arp-semester">{semester}</span>}
                <span className="arp-percentage">{percentage}%</span>
              </div>
              <table className="arp-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Marks</th>
                    <th>Max</th>
                    <th>%</th>
                    <th>Grade</th>
                    {!readOnly && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {groupRecords.map((r) => (
                    <tr key={r.id}>
                      <td>{r.subject_name}</td>
                      <td>{r.marks_obtained != null ? r.marks_obtained : "-"}</td>
                      <td>{r.max_marks != null ? r.max_marks : "-"}</td>
                      <td>{r.marks_obtained != null && r.max_marks ? ((r.marks_obtained / r.max_marks) * 100).toFixed(1) + "%" : "-"}</td>
                      <td>{r.grade || "-"}</td>
                      {!readOnly && (
                        <td>
                          <button className="arp-btn arp-btn-sm" onClick={() => handleEdit(r)}>Edit</button>
                          <button className="arp-btn arp-btn-sm arp-btn-danger" onClick={() => handleDelete(r.id)}>Del</button>
                        </td>
                      )}
                    </tr>
                  ))}
                  <tr className="arp-summary-row">
                    <td><strong>Total</strong></td>
                    <td><strong>{totalMarks}</strong></td>
                    <td><strong>{totalMax}</strong></td>
                    <td><strong>{percentage}%</strong></td>
                    <td colSpan={readOnly ? 1 : 2}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}
