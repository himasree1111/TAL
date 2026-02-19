import React from "react";
import "../AdminDashboard.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import useAdminData from "./hooks/useAdminData";
import useAdminActions from "./hooks/useAdminActions";

import AdminOverview from "./AdminOverview";
import ManageBeneficiaries from "./ManageBeneficiaries";
import DonorMapping from "./DonorMapping";
import FeeTracking from "./FeeTracking";
import AlertsBroadcast from "./AlertsBroadcast";
import ReportsExports from "./ReportsExports";
import AdminSettings from "./AdminSettings";

import ViewStudentModal from "./modals/ViewStudentModal";
import AddStudentModal from "./modals/AddStudentModal";
import EditStudentModal from "./modals/EditStudentModal";
import ViewDonorModal from "./modals/ViewDonorModal";
import EditStudentLegacyModal from "./modals/EditStudentLegacyModal";
import BroadcastModal from "./modals/BroadcastModal";
import ViewEligibleStudentModal from "./modals/ViewEligibleStudentModal";
import ViewNonEligibleStudentModal from "./modals/ViewNonEligibleStudentModal";

export default function AdminDashboard() {
  const data = useAdminData();
  const actions = useAdminActions(data);

  const {
    loading, activeSection, setActiveSection, query, setQuery,
    setBroadcastOpen,
  } = data;

  const sectionTitle = {
    overview: "Dashboard Overview",
    manage: "Manage Beneficiaries",
    mapping: "Donor Mapping",
    fees: "Fee Tracking",
    broadcast: "Alerts & Broadcast",
    reports: "Reports & Exports",
    settings: "Settings",
  };

  return (
    <div className="admin-root">
      <ToastContainer position="top-right" autoClose={3000} />
      <aside className="admin-sidebar">
        <div className="sidebar-top">
          <div className="brand">Touch A Life - Admin</div>
          <nav>
            <ul>
              {Object.entries(sectionTitle).map(([key, label]) => (
                <li key={key} className={activeSection === key ? "active" : ""} onClick={() => setActiveSection(key)}>
                  {label}
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <button className="logout-btn" onClick={actions.handleLogout}>Logout</button>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <h2>{sectionTitle[activeSection] || "Dashboard"}</h2>
          <div className="header-actions">
            <input placeholder="Search students or college..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <button className="btn primary" onClick={() => setBroadcastOpen(true)}>New Broadcast</button>
          </div>
        </header>

        <main className="admin-content">
          {loading && <div style={{ textAlign: "center", padding: "2rem" }} />}

          {!loading && activeSection === "overview" && (
            <AdminOverview totals={data.totals} />
          )}

          {activeSection === "manage" && (
            <ManageBeneficiaries
              filters={data.filters} setFilters={data.setFilters}
              donors={data.donors} uniqueCourses={data.uniqueCourses}
              filteredStudents={data.filteredStudents} students={data.students}
              lastFetch={data.lastFetch}
              setShowAddStudentModal={data.setShowAddStudentModal}
              exportCSV={actions.exportCSV} exportPDF={actions.exportPDF}
              setViewStudent={data.setViewStudent} setViewStudentDocs={data.setViewStudentDocs}
              setEditStudentModal={data.setEditStudentModal}
              handleApprove={actions.handleApprove} handleNotApprove={actions.handleNotApprove}
              handleDeleteStudent={actions.handleDeleteStudent}
            />
          )}

          {activeSection === "mapping" && (
            <DonorMapping
              donorMappings={data.donorMappings} donors={data.donors}
              newDonorForm={data.newDonorForm} setNewDonorForm={data.setNewDonorForm}
              handleExportDonorReport={actions.handleExportDonorReport}
              handleAddDonor={actions.handleAddDonor}
              handleDeleteDonorMapping={actions.handleDeleteDonorMapping}
              handleContactDonor={actions.handleContactDonor}
              setViewDonor={data.setViewDonor}
            />
          )}

          {activeSection === "fees" && (
            <FeeTracking
              feeSummary={data.feeSummary} feePayments={data.feePayments}
              newPaymentForm={data.newPaymentForm} setNewPaymentForm={data.setNewPaymentForm}
              handleDownloadFeeReport={actions.handleDownloadFeeReport}
              handleRecordPayment={actions.handleRecordPayment}
              handleDeletePayment={actions.handleDeletePayment}
            />
          )}

          {activeSection === "broadcast" && (
            <AlertsBroadcast
              broadcastTitle={data.broadcastTitle} setBroadcastTitle={data.setBroadcastTitle}
              broadcastMessage={data.broadcastMessage} setBroadcastMessage={data.setBroadcastMessage}
              broadcastRecipient={data.broadcastRecipient} setBroadcastRecipient={data.setBroadcastRecipient}
              adminNotifications={data.adminNotifications}
              handleSendBroadcast={actions.handleSendBroadcast}
              handleDeleteNotification={actions.handleDeleteNotification}
            />
          )}

          {activeSection === "reports" && (
            <ReportsExports
              reportStartDate={data.reportStartDate} setReportStartDate={data.setReportStartDate}
              reportEndDate={data.reportEndDate} setReportEndDate={data.setReportEndDate}
              filteredFeeSummary={data.filteredFeeSummary} setFilteredFeeSummary={data.setFilteredFeeSummary}
              filteredDonationSummary={data.filteredDonationSummary} setFilteredDonationSummary={data.setFilteredDonationSummary}
              feeSummary={data.feeSummary} feePayments={data.feePayments}
              donors={data.donors} donorMappings={data.donorMappings} students={data.students}
              eligibleCount={data.eligibleCount} nonEligibleCount={data.nonEligibleCount}
              eligibleStudents={data.eligibleStudents} nonEligibleStudents={data.nonEligibleStudents}
              loadingEligible={data.loadingEligible} loadingNonEligible={data.loadingNonEligible}
              activeReportList={data.activeReportList} setActiveReportList={data.setActiveReportList}
              fetchEligibleStudents={data.fetchEligibleStudents}
              fetchNonEligibleStudents={data.fetchNonEligibleStudents}
              handleGenerateReport={actions.handleGenerateReport}
              handleDownloadFeeReport={actions.handleDownloadFeeReport}
              handleExportDonorReport={actions.handleExportDonorReport}
              handleDownloadEligibleReport={actions.handleDownloadEligibleReport}
              handleDownloadNonEligibleReport={actions.handleDownloadNonEligibleReport}
              exportPDF={actions.exportPDF}
              setViewEligibleStudent={data.setViewEligibleStudent}
              setViewNonEligibleStudent={data.setViewNonEligibleStudent}
            />
          )}

          {activeSection === "settings" && (
            <AdminSettings
              adminName={data.adminName} setAdminName={data.setAdminName}
              currentUser={data.currentUser}
              contactNumber={data.contactNumber} setContactNumber={data.setContactNumber}
              emailNotifications={data.emailNotifications} setEmailNotifications={data.setEmailNotifications}
              smsAlerts={data.smsAlerts} setSmsAlerts={data.setSmsAlerts}
              systemNotifications={data.systemNotifications} setSystemNotifications={data.setSystemNotifications}
              defaultLanguage={data.defaultLanguage} setDefaultLanguage={data.setDefaultLanguage}
              timeZone={data.timeZone} setTimeZone={data.setTimeZone}
              handleSaveSettings={actions.handleSaveSettings}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <ViewStudentModal
        viewStudent={data.viewStudent} viewStudentDocs={data.viewStudentDocs}
        setViewStudent={data.setViewStudent} setViewStudentDocs={data.setViewStudentDocs}
        currentUser={data.currentUser}
      />

      {data.showAddStudentModal && (
        <AddStudentModal
          addStudentForm={data.addStudentForm} setAddStudentForm={data.setAddStudentForm}
          setShowAddStudentModal={data.setShowAddStudentModal}
          handleAddStudent={actions.handleAddStudent}
        />
      )}

      <EditStudentModal
        editStudentModal={data.editStudentModal} setEditStudentModal={data.setEditStudentModal}
        handleEditStudentSave={actions.handleEditStudentSave}
      />

      <ViewDonorModal
        viewDonor={data.viewDonor} setViewDonor={data.setViewDonor}
        handleContactDonor={actions.handleContactDonor}
      />

      <EditStudentLegacyModal
        editStudent={data.editStudent} setEditStudent={data.setEditStudent}
        handleEditSave={actions.handleEditSave}
      />

      <BroadcastModal
        broadcastOpen={data.broadcastOpen} setBroadcastOpen={data.setBroadcastOpen}
        currentUser={data.currentUser} setAdminNotifications={data.setAdminNotifications}
      />

      <ViewEligibleStudentModal
        viewEligibleStudent={data.viewEligibleStudent} setViewEligibleStudent={data.setViewEligibleStudent}
      />

      <ViewNonEligibleStudentModal
        viewNonEligibleStudent={data.viewNonEligibleStudent} setViewNonEligibleStudent={data.setViewNonEligibleStudent}
      />
    </div>
  );
}
