import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../utils/api";

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingCompaniesCount, setPendingCompaniesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAdminMetrics() {
      try {
        const [overviewData, pendingCompanies] = await Promise.all([
          apiFetch("/api/stats/overview"),
          apiFetch("/api/admin/companies/pending"),
        ]);
        
        setStats(overviewData);
        setPendingCompaniesCount(pendingCompanies.length);
      } catch (err) {
        console.error(err);
        setError("Failed to load administration metrics.");
      } finally {
        setLoading(false);
      }
    }

    loadAdminMetrics();
  }, []);

  if (loading) {
    return <div style={{ color: "var(--color-text-secondary)" }}>Loading administrative workspace...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-navy-dark)", marginBottom: "0.25rem" }}>
          TPO Administration Console
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          Manage recruiter registrations, verify student academic credentials, and view campus metrics.
        </p>
      </div>

      {/* Admin Action Alerts / Queue Counters */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
        {pendingCompaniesCount > 0 && (
          <div className="alert alert-warning" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "4px solid var(--color-warning)" }}>
            <div>
              <strong>Pending Recruiter Approvals:</strong> There are {pendingCompaniesCount} company registration requests waiting for TPO approval.
            </div>
            <Link to="/approve-companies" className="btn btn-primary" style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem", backgroundColor: "var(--color-warning)", borderColor: "var(--color-warning)" }}>
              Approve Recruiter Requests
            </Link>
          </div>
        )}
      </div>

      {/* General Stats Grid */}
      <div className="dashboard-grid">
        <div className="card">
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            Registered Students
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-navy-dark)", marginTop: "0.5rem", fontFamily: "var(--font-mono)" }}>
            {stats.total_students}
          </div>
          <Link to="/verify-students" style={{ fontSize: "0.85rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: 500, display: "inline-block", marginTop: "0.5rem" }}>
            Verify pending profiles &rarr;
          </Link>
        </div>

        <div className="card">
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            Hired Selections
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-success)", marginTop: "0.5rem", fontFamily: "var(--font-mono)" }}>
            {stats.total_placed}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginTop: "0.5rem" }}>
            Hiring rate: {stats.overall_placement_rate}%
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            Recruitment Drives
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-navy)", marginTop: "0.5rem", fontFamily: "var(--font-mono)" }}>
            {stats.total_drives}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginTop: "0.5rem" }}>
            Active drives on portal
          </div>
        </div>
      </div>

      {/* Admin Panel Welcome Card */}
      <div className="card">
        <h3 className="card-title">Placement Administration</h3>
        <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
          Use the left sidebar links to perform administrative operations. Ensure student CGPAs and backlog numbers match 
          college records when verifying profiles, and confirm corporate details (domain name, corporate email domain) 
          prior to granting recruiter approval to avoid security incidents.
        </p>
      </div>
    </div>
  );
};
export default AdminDashboard;
