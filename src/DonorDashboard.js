import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  Settings,
  LogOut,
  BookOpen,
  Heart,
  ChevronDown,
  FileText,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import "./DonorDashboard.css";

// --- Navigation Items ---
const NAV_ITEMS = [
  { name: "Dashboard", icon: Home, active: true },
  { name: "Donations & Reports", icon: FileText },
  { name: "Student Impact", icon: BookOpen },
  { name: "Analytics", icon: BarChart3 },
];

const DONOR_ITEMS = [
  { name: "My Profile", icon: Users },
  { name: "Settings", icon: Settings },
  { name: "Support", icon: Heart },
];

// --- Dashboard Data ---
const METRICS = [
  { title: "Total Donated", value: 67343, change: "+10.2% YTD", color: "green" },
  { title: "Students Sponsored", value: 23, change: "+2 since last quarter", color: "blue" },
  { title: "Active Campaigns", value: 3, change: "Ongoing", color: "orange" },
];

const DONATION_OVERVIEW = [
  { title: "Scholarships Active", value: 45 },
  { title: "Current Campaign Goal", value: 125000 },
  { title: "Pending Matching Funds", value: 5000 },
  { title: "Total Donors in Network", value: 3450 },
];

const IMPACT_UPDATES = [
  { text: "New student 'S.K.' awarded under your sponsorship.", color: "blue" },
  { text: "Quarterly impact report generated for FY2025.", color: "green" },
  { text: "Books for Girls campaign at 80% completion.", color: "orange" },
];

const STUDENT_TABLE = [
  { name: "Aarushi Singh", college: "GNITS", year: "3rd Year", amount: 25000 },
  { name: "Meera Patel", college: "OU", year: "2nd Year", amount: 18000 },
  { name: "Sanjana Reddy", college: "VNRVJIET", year: "1st Year", amount: 22000 },
];

// --- Sidebar ---
const Sidebar = ({ navigate }) => (
  <aside className="sidebar">
    <div>
      <h1 className="logo-text">Touch A Life</h1>
      <nav className="nav-menu">
        {NAV_ITEMS.map((item) => (
          <a key={item.name} href="#" className={`nav-item ${item.active ? "active" : ""}`}>
            <item.icon size={18} className="nav-icon" />
            {item.name}
          </a>
        ))}
      </nav>
      <hr className="divider" />
      <nav className="nav-menu">
        {DONOR_ITEMS.map((item) => (
          <a key={item.name} href="#" className="nav-item">
            <item.icon size={18} className="nav-icon" />
            {item.name}
          </a>
        ))}
        <a onClick={() => navigate("/login")} className="nav-item" style={{ cursor: "pointer" }}>
          <LogOut size={18} className="nav-icon" />
          Quit
        </a>
      </nav>
    </div>
    <div className="support-box">
      <div className="support-graphic">[Support Graphic]</div>
      <p className="support-text">24/7 Support</p>
    </div>
  </aside>
);

// --- Metric Card ---
const MetricCard = ({ title, value, change, color }) => (
  <div className="metric-card">
    <div className="card-content">
      <p className="card-title">{title}</p>
      <h2 className="card-value">
        {title.toLowerCase().includes("donated") ? `₹${value.toLocaleString()}` : value}
      </h2>
      <p className={`card-change ${color === "green" ? "positive-change" : ""}`}>{change}</p>
    </div>
    <div className={`card-icon-wrapper icon-${color}`}>
      {color === "green" ? (
        <TrendingUp size={22} />
      ) : color === "blue" ? (
        <BookOpen size={22} />
      ) : (
        <BarChart3 size={22} />
      )}
    </div>
  </div>
);

// --- Overview Section ---
const OverviewCard = () => (
  <div className="dashboard-card overview-list">
    <div className="card-header-flex">
      <h2 className="card-header-title">Donation Overview</h2>
      <a href="#" className="view-link">
        This Quarter <ChevronDown size={14} style={{ marginLeft: "4px" }} />
      </a>
    </div>
    <div className="overview-items">
      {DONATION_OVERVIEW.map((item, index) => (
        <div key={index} className="overview-item">
          <span className="overview-item-title">{item.title}</span>
          <span className="overview-item-value">
            {item.title.includes("Goal") || item.title.includes("Funds")
              ? `₹${item.value.toLocaleString()}`
              : item.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  </div>
);

// --- Sponsorship Table ---
const SponsorshipTable = () => (
  <div className="dashboard-card student-table">
    <div className="card-header-flex">
      <h2 className="card-header-title">Your Sponsored Students</h2>
      <a href="#" className="view-link-green">Export Report</a>
    </div>
    <table>
      <thead>
        <tr>
          <th>Student Name</th>
          <th>College</th>
          <th>Year</th>
          <th>Sponsored Amount</th>
        </tr>
      </thead>
      <tbody>
        {STUDENT_TABLE.map((student, index) => (
          <tr key={index}>
            <td>{student.name}</td>
            <td>{student.college}</td>
            <td>{student.year}</td>
            <td>₹{student.amount.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- Financial Progress Chart ---
const FinancialProgress = () => {
  const percentage = 75;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="dashboard-card total-sale-chart">
      <div className="card-header-flex">
        <h2 className="card-header-title">Annual Donation Goal</h2>
        <a href="#" className="view-link-green">View Progress</a>
      </div>
      <div className="chart-container">
        <svg viewBox="0 0 140 140" className="chart-svg">
          <circle cx="70" cy="70" r={radius} fill="transparent" stroke="#f0f0f0" strokeWidth="16" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="transparent"
            stroke="#10b981"
            strokeWidth="16"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transform: "rotate(-90deg)", transformOrigin: "70px 70px" }}
          />
        </svg>
        <div className="chart-percentage">
          <span className="percentage-value">{percentage}%</span>
        </div>
      </div>
      <p className="chart-info">
        You’ve achieved {percentage}% of this year’s donation target.
      </p>
    </div>
  );
};

// --- Recent Impact Updates ---
const ImpactFeed = () => (
  <div className="dashboard-card activity-feed">
    <div className="card-header-flex">
      <h2 className="card-header-title">Recent Impact Updates</h2>
      <a href="#" className="view-link-green">View All</a>
    </div>
    {IMPACT_UPDATES.map((item, index) => (
      <div key={index} className="activity-item">
        <span className={`activity-dot dot-${item.color}`}></span>
        <p className="activity-text">{item.text}</p>
      </div>
    ))}
  </div>
);

// --- Main Donor Dashboard ---
const DonorDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <div className="dashboard-layout">
        <Sidebar navigate={navigate} />
        <main className="main-content">
          <header className="main-header">
            <h1 className="page-title">Donor Impact Dashboard</h1>
            <div className="user-info">
              <span className="user-name">Monica Ashan</span>
              <div className="user-avatar"></div>
            </div>
          </header>

          <div className="metrics-grid">
            {METRICS.map((item, i) => (
              <MetricCard
                key={i}
                title={item.title}
                value={item.value}
                change={item.change}
                color={item.color}
              />
            ))}
          </div>

          <div className="bottom-grid">
            <OverviewCard />
            <FinancialProgress />
            <SponsorshipTable />
            <ImpactFeed />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DonorDashboard;
