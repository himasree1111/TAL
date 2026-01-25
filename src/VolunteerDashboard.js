import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./VolunteerDashboard.css";
import supabase from "./supabaseClient";

export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [volunteerName, setVolunteerName] = useState("Volunteer");
  const [volunteerEmail, setVolunteerEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVolunteerData = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setLoading(false);
        return;
      }

      const user = data.session.user;
      const email = user.email;

      setVolunteerEmail(email);
      setVolunteerName(
        user.user_metadata?.name || email.split("@")[0]
      );

      await fetchForms(email);
    };

    fetchVolunteerData();
  }, []);

  const fetchForms = async (volunteerEmail) => {
    setLoading(true);

    const { data, error } = await supabase
      .from("student_form_submissions")
      .select(
        "id, first_name, last_name, camp_name, created_at, age, school, class, volunteer_email"
      )
      .eq("volunteer_email", volunteerEmail)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching forms:", error);
      setLoading(false);
      return;
    }

    const transformedForms = (data || []).map((submission, index) => ({
      id: submission.id,
      displayId: index + 1,
      title: `${submission.first_name} ${submission.last_name}`,
      campName: submission.camp_name || "-",
      dateSubmitted: new Date(submission.created_at)
        .toISOString()
        .split("T")[0],
      details: `Student: ${submission.first_name} ${submission.last_name}, Age: ${submission.age}, School: ${submission.school}, Class: ${submission.class}`,
      dataForEdit: submission
    }));

    setForms(transformedForms);
    setLoading(false);
  };

  const handleFormClick = (id) => {
    setSelectedFormId(id);
  };

  const handleFillFormClick = () => {
    localStorage.removeItem("editFormData");
    navigate("/studentform");
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm("Are you sure you want to delete this form?")) return;

    const { error } = await supabase
      .from("student_form_submissions")
      .delete()
      .eq("id", parseInt(id));

    if (error) {
      alert("Error deleting form");
      return;
    }

    setForms((prev) => prev.filter((form) => form.id !== id));
    if (selectedFormId === id) setSelectedFormId(null);
  };

  const handleEditClick = (form) => {
    navigate(`/studentform/${form.id}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const selectedForm = forms.find((f) => f.id === selectedFormId);

  const thisMonthForms = forms.filter(
    (f) => new Date(f.dateSubmitted).getMonth() === new Date().getMonth()
  ).length;

  const lastMonthForms = forms.filter((f) => {
    const formDate = new Date(f.dateSubmitted);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return (
      formDate.getMonth() === lastMonth.getMonth() &&
      formDate.getFullYear() === lastMonth.getFullYear()
    );
  }).length;

  return (
    <div className="volunteer-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="profile">
            <h2>{volunteerName}</h2>
            <p>{volunteerEmail}</p>
          </div>

          <div className="stats">
            <div className="card">
              <h3>{thisMonthForms}</h3>
              <p>This Month</p>
            </div>
            <div className="card">
              <h3>{lastMonthForms}</h3>
              <p>Last Month</p>
            </div>
            <div className="card">
              <h3>{forms.length}</h3>
              <p>Total Forms</p>
            </div>
          </div>
        </div>

        <button className="sidebar-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="main-header">
          <button className="btn primary fill-form-btn" onClick={handleFillFormClick}>
            New Form
          </button>
        </div>

        <div className="table-wrapper">
          {loading && (
            <div style={{ padding: 16, color: "#6b7280" }}>
              Loading forms...
            </div>
          )}

          <table className="forms-table">
            <thead>
              <tr>
                <th>Form ID</th>
                <th>Name</th>
                <th>Camp Name</th>
                <th>Submitted Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {forms.map((form) => (
                <tr
                  key={form.id}
                  className={form.id === selectedFormId ? "selected" : ""}
                >
                  <td onClick={() => handleFormClick(form.id)}>
                    {form.displayId}
                  </td>
                  <td onClick={() => handleFormClick(form.id)}>
                    {form.title}
                  </td>
                  <td onClick={() => handleFormClick(form.id)}>
                    {form.campName}
                  </td>
                  <td onClick={() => handleFormClick(form.id)}>
                    {form.dateSubmitted}
                  </td>
                  <td>
                    <button
                      className="btn primary small icon"
                      onClick={() => handleEditClick(form)}
                    >
                      ✎
                    </button>
                    <button
                      className="btn danger small icon"
                      onClick={() => handleDeleteClick(form.id)}
                    >
                      🗑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && forms.length === 0 && (
            <div style={{ padding: 16, textAlign: "center", color: "#6b7280" }}>
              No submitted forms found for this volunteer.
            </div>
          )}
        </div>

        {selectedForm && (
          <div className="form-details">
            <h2>{selectedForm.title}</h2>
            <p>{selectedForm.details}</p>
          </div>
        )}
      </main>
    </div>
  );
}
