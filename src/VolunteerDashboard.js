import React, { useEffect, useState } from "react";
import supabase from "./supabaseClient";

// Simple Bar Chart Component
const BarChart = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const chartHeight = 200;
  const barWidth = 40;
  const gap = 15;

  return (
    <div style={{backgroundColor: "#ffffff", borderRadius: "8px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginTop: "20px"}}>
      <h3 style={{margin: "0 0 15px 0", color: "#0052cc", fontSize: "1.1rem", fontWeight: "700"}}>{title}</h3>
      <svg width="100%" height={chartHeight + 60} style={{minHeight: "280px"}}>
        {/* Y-axis */}
        <line x1="40" y1="20" x2="40" y2={chartHeight + 20} stroke="#e1e4e8" strokeWidth="1" />
        {/* X-axis */}
        <line x1="40" y1={chartHeight + 20} x2={data.length * (barWidth + gap) + 60} y2={chartHeight + 20} stroke="#e1e4e8" strokeWidth="1" />
        
        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <text key={`y-label-${i}`} x="35" y={chartHeight + 20 - (i * chartHeight / 5)} textAnchor="end" fontSize="11" fill="#666">
            {(maxValue * i / 5).toFixed(0)}
          </text>
        ))}

        {/* Bars and Labels */}
        {data.map((item, idx) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          const xPos = 60 + idx * (barWidth + gap);
          return (
            <g key={`bar-${idx}`}>
              <rect 
                x={xPos} 
                y={chartHeight + 20 - barHeight} 
                width={barWidth} 
                height={barHeight} 
                fill="#3b82f6" 
                rx="4"
              />
              <text 
                x={xPos + barWidth / 2} 
                y={chartHeight + 40} 
                textAnchor="middle" 
                fontSize="12" 
                fill="#666"
              >
                {item.label}
              </text>
              <text 
                x={xPos + barWidth / 2} 
                y={chartHeight + 20 - barHeight - 5} 
                textAnchor="middle" 
                fontSize="12" 
                fontWeight="700"
                fill="#0052cc"
              >
                {item.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default function VolunteerDashboard() {
  const [forms, setForms] = useState([]);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [volunteerName, setVolunteerName] = useState("Volunteer");
  const [volunteerEmail, setVolunteerEmail] = useState("");
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    // Fetch logged-in volunteer data from Supabase
    const fetchVolunteerData = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const user = data.session.user;
          setVolunteerEmail(user.email || "");
          
          // Get the volunteer's name from user metadata or email
          const name = user.user_metadata?.name || user.email?.split("@")[0] || "Volunteer";
          setVolunteerName(name);
        }
      } catch (error) {
        console.error("Error fetching volunteer data:", error);
      }
    };

    fetchVolunteerData();

    // Initialize dummy forms data
    const dummyForms = [
      { id: 1, title: "Form 1", dateSubmitted: "2024-01-15", details: "Details for Form 1 here, including other relevant information about the form.", dataForEdit: { first_name: "John", last_name: "Doe", age: 20 } },
      { id: 2, title: "Form 2", dateSubmitted: "2024-02-20", details: "Details for Form 2 here, including other relevant information about the form.", dataForEdit: { first_name: "Jane", last_name: "Smith", age: 22 } },
      { id: 3, title: "Form 3", dateSubmitted: "2024-03-05", details: "Details for Form 3 here, including other relevant information about the form.", dataForEdit: { first_name: "Alice", last_name: "Johnson", age: 21 } },
      { id: 4, title: "Form 4", dateSubmitted: "2024-04-10", details: "Details for Form 4", dataForEdit: { first_name: "Bob", last_name: "Williams", age: 23 } },
      { id: 5, title: "Form 5", dateSubmitted: "2024-05-18", details: "Details for Form 5", dataForEdit: { first_name: "Carol", last_name: "Davis", age: 24 } },
      { id: 6, title: "Form 6", dateSubmitted: "2024-06-12", details: "Details for Form 6", dataForEdit: { first_name: "David", last_name: "Miller", age: 25 } },
    ];
    setForms(dummyForms);

    // Generate monthly data for chart
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = months.map((month, idx) => {
      const formsInMonth = dummyForms.filter(f => new Date(f.dateSubmitted).getMonth() === idx).length;
      return {
        label: month,
        value: formsInMonth > 0 ? formsInMonth : Math.floor(Math.random() * 5) // Random data for months without forms
      };
    });
    setMonthlyData(chartData);
  }, []);

  const handleFormClick = (id) => {
    setSelectedFormId(id);
  };

  const handleFillFormClick = () => {
    // Clear any existing edit data
    localStorage.removeItem("editFormData");
    window.location.href = "/studentform"; // or use navigate in real app
  };

  const handleDeleteClick = (id) => {
    if(window.confirm("Are you sure you want to delete this form?")) {
      setForms((prev) => prev.filter(form => form.id !== id));
      // If deleted form was selected, clear selection
      if (selectedFormId === id) setSelectedFormId(null);
    }
  };

  const handleEditClick = (form) => {
    // Save form data for edit in localStorage (or context/state management)
    localStorage.setItem("editFormData", JSON.stringify(form.dataForEdit));
    // Navigate to form page for editing
    window.location.href = "/studentform";
  };

  const selectedForm = forms.find(f => f.id === selectedFormId);

  return (
    <div className="volunteer-dashboard" style={{display: "flex", height: "100vh", width: "100vw", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"}}>
      <aside className="sidebar" style={{width: "280px", backgroundColor: "#0052cc", color: "white", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
        <div className="profile" style={{textAlign: "center"}}>
          {/* Avatar removed as per request */}
          <h2 style={{margin: 0}}>{volunteerName}</h2>
          <p style={{marginTop: "6px", fontSize: "0.9rem", opacity: 0.85}}>{volunteerEmail}</p>
        </div>
        <div className="stats" style={{marginTop: "40px", display: "flex", flexDirection: "column", gap: "12px"}}>
          <div style={{display: "flex", gap: "12px", justifyContent: "space-between"}}>
            <div className="card" style={{backgroundColor: "#fff4e6", borderRadius: "8px", padding: "15px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", flex: 1}}>
              <h3 style={{margin:0, fontSize: "1.6rem", color: "#f59e0b"}}>{forms.filter(f => new Date(f.dateSubmitted).getMonth() === new Date().getMonth()).length}</h3>
              <p style={{marginTop: "2px", fontWeight: "600", fontSize: "0.85rem", letterSpacing: "0.02em", color: "#1D2B4A"}}>This Month</p>
            </div>
            <div className="card" style={{backgroundColor: "#e0f2fe", borderRadius: "8px", padding: "15px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", flex: 1}}>
              <h3 style={{margin:0, fontSize: "1.6rem", color: "#0284c7"}}>{forms.filter(f => {
                const formDate = new Date(f.dateSubmitted);
                const lastMonth = new Date();
                lastMonth.setMonth(lastMonth.getMonth() - 1);
                return formDate.getMonth() === lastMonth.getMonth() && formDate.getFullYear() === lastMonth.getFullYear();
              }).length}</h3>
              <p style={{marginTop: "2px", fontWeight: "600", fontSize: "0.85rem", letterSpacing: "0.02em", color: "#1D2B4A"}}>Last Month</p>
            </div>
          </div>
          <div className="card" style={{backgroundColor: "#edf2ff", borderRadius: "8px", padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)"}}>
            <h3 style={{margin:0, fontSize: "1.9rem", color: "#0052cc"}}>{forms.length}</h3>
            <p style={{marginTop: "4px", fontWeight: "600", letterSpacing: "0.03em", color: "#1D2B4A"}}>Total Forms Submitted</p>
          </div>
        </div>
      </aside>
      <main className="main-content" style={{flex:1, backgroundColor: "white", padding: "25px 30px", overflowY: "auto"}}>
        <div className="main-header" style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px"}}>
          <div>
            <h1 style={{margin: "0 0 6px 0", color: "#0052cc", fontWeight: "700", fontSize: "2.1rem"}}>Volunteer Dashboard</h1>
            <p style={{margin: 0, color: "#666", fontSize: "0.95rem"}}>Welcome, <strong>{volunteerName}</strong></p>
          </div>
          <button className="fill-form-btn" onClick={handleFillFormClick} style={{
            padding: "10px 24px",
            backgroundColor: "#3b82f6",
            border: "none",
            borderRadius: "50px",
            color: "white",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "0.95rem",
            transition: "all 0.3s ease",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 2px 8px rgba(59, 130, 246, 0.2)"
          }} onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = "#2563eb";
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(59, 130, 246, 0.4)";
          }} onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = "#3b82f6";
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.2)";
          }}>
            <span style={{fontSize: "1.2rem"}}>+</span>
            New Form
          </button>
        </div>
        
        {/* Performance Chart */}
        {monthlyData.length > 0 && <BarChart data={monthlyData} title="Volunteer Performance - Forms Submitted by Month (2024)" />}
        
        <table className="forms-table" style={{marginTop: "30px", borderCollapse: "collapse", width: "100%"}}>
          <thead style={{backgroundColor: "#edf2ff"}}>
            <tr>
              <th style={{padding: "14px 18px", borderBottom: "1px solid #e1e4e8", textAlign: "left", fontSize: "1rem"}}>Form ID</th>
              <th style={{padding: "14px 18px", borderBottom: "1px solid #e1e4e8", textAlign: "left", fontSize: "1rem"}}>Title</th>
              <th style={{padding: "14px 18px", borderBottom: "1px solid #e1e4e8", textAlign: "left", fontSize: "1rem"}}>Date Submitted</th>
              <th style={{padding: "14px 18px", borderBottom: "1px solid #e1e4e8", textAlign: "left", fontSize: "1rem"}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {forms.map(form => (
            <tr key={form.id} style={{
                backgroundColor: form.id === selectedFormId ? "#d0e0ff" : "transparent",
              }}>
                <td style={{padding: "14px 18px", borderBottom: "1px solid #e1e4e8", cursor: "pointer"}} onClick={() => handleFormClick(form.id)}>{form.id}</td>
                <td style={{padding: "14px 18px", borderBottom: "1px solid #e1e4e8", cursor: "pointer"}} onClick={() => handleFormClick(form.id)}>{form.title}</td>
                <td style={{padding: "14px 18px", borderBottom: "1px solid #e1e4e8", cursor : "pointer"}} onClick={() => handleFormClick(form.id)}>{form.dateSubmitted}</td>
                <td style={{padding: "14px 18px", borderBottom: "1px solid #e1e4e8", display: "flex", gap: "12px", alignItems: "center", justifyContent: "center"}}>
                  <button style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#f0f2f5",
                    border: "none",
                    cursor: "pointer",
                    color: "#0079bf",
                    fontSize: "1.1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    flexShrink: 0
                  }} 
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#e8eef5";
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.12)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#f0f2f5";
                    e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
                  }}
                  onClick={() => handleEditClick(form)} 
                  aria-label="Edit form" 
                  title="Edit">
                    ✎
                  </button>
                  <button style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#f0f2f5",
                    border: "none",
                    cursor: "pointer",
                    color: "#dc3545",
                    fontSize: "1.1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    flexShrink: 0
                  }} 
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#ffe8e8";
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.12)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#f0f2f5";
                    e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.05)";
                  }}
                  onClick={() => handleDeleteClick(form.id)} 
                  aria-label="Delete form" 
                  title="Delete">
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {selectedForm && (
          <div className="form-details" style={{
            marginTop: "30px",
            padding: "20px",
            border: "1px solid #d6d9dc",
            borderRadius: "8px",
            backgroundColor: "#fafafa"
          }}>
            <h2 style={{marginTop: 0, color: "#0052cc"}}>{selectedForm.title}</h2>
            <p style={{fontSize: "1rem", lineHeight: "1.5"}}>{selectedForm.details}</p>
          </div>
        )}
      </main>
    </div>
  );
}
