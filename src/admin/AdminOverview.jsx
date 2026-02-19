import React from "react";

export default function AdminOverview({ totals }) {
  return (
    <>
      <section className="cards-row">
        <div className="card">
          <div className="card-icon student-icon">👥</div>
          <div className="card-content">
            <div className="card-title">Students Under Review</div>
            <div className="card-value">{totals.totalStudents}</div>
            <div className="card-trend positive">↑ 12% from last month</div>
          </div>
        </div>
        <div className="card">
          <div className="card-icon money-icon">💰</div>
          <div className="card-content">
            <div className="card-title">Donation  Collected</div>
            <div className="card-value">₹{totals.feesCollected}</div>
            <div className="card-trend positive">↑ 8% from last month</div>
          </div>
        </div>
        <div className="card">
          <div className="card-icon pending-icon">⏳</div>
          <div className="card-content">
            <div className="card-title">Pending Fees</div>
            <div className="card-value">{totals.pendingFees}</div>
            <div className="card-trend negative">↑ 2% from last month</div>
          </div>
        </div>
        <div className="card">
          <div className="card-icon donor-icon">🤝</div>
          <div className="card-content">
            <div className="card-title">Active Donors</div>
            <div className="card-value">{totals.activeDonors}</div>
            <div className="card-trend positive">↑ 5% from last month</div>
          </div>
        </div>
      </section>
    </>
  );
}
