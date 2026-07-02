import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";

export const CompanyDashboard = () => {
  const { user, refreshUser } = useAuth();
  const company = user?.profile;

  const [myDrives, setMyDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalDrives: 0,
    totalApplicants: 0,
    totalSelected: 0,
  });

  useEffect(() => {
    async function loadCompanyStats() {
      if (!company || company.status !== "approved") {
        setLoading(false);
        return;
      }

      try {
        // Fetch all drives
        const drivesData = await apiFetch("/api/drives");
        // Filter to own drives
        const ownDrives = drivesData.filter((d) => d.company_id === company.id);
        setMyDrives(ownDrives);

        // Fetch applicants for each drive
        let applicantsCount = 0;
        let selectionsCount = 0;

        for (const drive of ownDrives) {
          try {
            const apps = await apiFetch(`/api/applications/drive/${drive.id}`);
            applicantsCount += apps.length;
            selectionsCount += apps.filter((a) => a.status === "selected").length;
          } catch (e) {
            console.error(`Failed to load applicants for drive ${drive.id}`, e);
          }
        }

        setStats({
          totalDrives: ownDrives.length,
          totalApplicants: applicantsCount,
          totalSelected: selectionsCount,
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load recruitment dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    loadCompanyStats();
  }, [company]);

  if (loading) {
    return <div style={{ color: "var(--color-text-secondary)" }}>Loading recruiter workspace...</div>;
  }

  if (!company) {
    return <div className="alert alert-danger">Recruiter profile information could not be found.</div>;
  }

  // Render pending approval view if company is not approved
  if (company.status !== "approved") {
    return (
      <div>
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-navy-dark)" }}>
            Recruiter Account Approval Pending
          </h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
            Campus Placement Office registration verification
          </p>
        </div>

        <div className="card" style={{ borderLeft: "4px solid var(--color-warning)", backgroundColor: "#FEF3C7", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-warning)" }}>
            Verification Required
          </h3>
          <p style={{ fontSize: "0.95rem", color: "var(--color-text-primary)", lineHeight: 1.5 }}>
            Thank you for registering <strong>{company.company_name}</strong> on our portal. Your account is 
            currently in <strong>{company.status}</strong> status. 
            Before you can post job roles or view student profiles, the Training & Placement Officer (TPO) 
            must verify your credentials and approve your recruiter profile to prevent resume harvesting.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0.75rem 1rem", backgroundColor: "#FFFFFF", borderRadius: "6px", border: "1px solid var(--color-border)", fontSize: "0.85rem" }}>
            <div><strong>Company Name:</strong> {company.company_name}</div>
            <div><strong>Website:</strong> <a href={company.website} target="_blank" rel="noreferrer">{company.website}</a></div>
            <div><strong>HR Representative:</strong> {company.hr_contact_name}</div>
            <div><strong>HR Contact Phone:</strong> {company.hr_contact_phone}</div>
          </div>
          <p style={{ fontSize: "0.825rem", color: "var(--color-text-secondary)" }}>
            Please get in touch with the college TPO if you need immediate approval. You can refresh this page once approved.
          </p>
          <button onClick={refreshUser} className="btn btn-secondary" style={{ alignSelf: "start", marginTop: "0.5rem" }}>
            Refresh Approval Status
          </button>
        </div>
      </div>
    );
  }

  // Render full dashboard for approved companies
  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-navy-dark)", marginBottom: "0.25rem" }}>
          {company.company_name} Workspace
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          Recruitment Dashboard & Recruitment Drive Manager
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Recruiter Metrics */}
      <div className="dashboard-grid">
        <div className="card" style={{ borderLeft: "4px solid var(--color-primary)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            Job Drives Posted
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-navy-dark)", marginTop: "0.5rem", fontFamily: "var(--font-mono)" }}>
            {stats.totalDrives}
          </div>
          <Link to="/manage-drives" style={{ fontSize: "0.85rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: 500, display: "inline-block", marginTop: "0.5rem" }}>
            Manage job drives &rarr;
          </Link>
        </div>

        <div className="card" style={{ borderLeft: "4px solid #8b5cf6" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            Total Applicants
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#8b5cf6", marginTop: "0.5rem", fontFamily: "var(--font-mono)" }}>
            {stats.totalApplicants}
          </div>
          <Link to="/manage-drives" style={{ fontSize: "0.85rem", color: "#8b5cf6", textDecoration: "none", fontWeight: 500, display: "inline-block", marginTop: "0.5rem" }}>
            Review applicants &rarr;
          </Link>
        </div>

        <div className="card" style={{ borderLeft: "4px solid var(--color-success)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
            Hired Selections
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-success)", marginTop: "0.5rem", fontFamily: "var(--font-mono)" }}>
            {stats.totalSelected}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginTop: "0.5rem" }}>
            Students placed with {company.company_name}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }} className="form-row">
        {/* Recruiter quick actions card */}
        <div className="card">
          <h3 className="card-title">Recruiter Quick Actions</h3>
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <Link to="/post-drive" className="btn btn-primary" style={{ padding: "0.75rem 1.25rem" }}>
              Post New Placement Drive
            </Link>
            <Link to="/manage-drives" className="btn btn-secondary" style={{ padding: "0.75rem 1.25rem" }}>
              Manage Active Drives
            </Link>
          </div>
        </div>

        {/* HR Profile Details */}
        <div className="card">
          <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--color-navy)", marginBottom: "0.75rem" }}>
            HR Contact Info
          </h4>
          <ul style={{ listStyle: "none", fontSize: "0.825rem", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            <li><strong>Representative:</strong> {company.hr_contact_name}</li>
            <li><strong>Phone:</strong> {company.hr_contact_phone}</li>
            <li><strong>Email:</strong> {user.email}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
export default CompanyDashboard;
