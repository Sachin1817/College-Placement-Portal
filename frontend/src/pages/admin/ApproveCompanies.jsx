import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

export const ApproveCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function loadPending() {
    try {
      const data = await apiFetch("/api/admin/companies/pending");
      setCompanies(data);
    } catch (err) {
      console.error(err);
      setError("Failed to retrieve pending companies.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPending();
  }, []);

  const handleApprove = async (id, name) => {
    setError("");
    setSuccessMsg("");
    try {
      await apiFetch(`/api/admin/companies/${id}/approve`, {
        method: "PATCH",
      });
      setSuccessMsg(`Successfully approved registration for ${name}!`);
      loadPending();
    } catch (err) {
      setError(err.message || "Failed to approve company.");
    }
  };

  const handleReject = async (id, name) => {
    if (!window.confirm(`Are you sure you want to reject company registration for ${name}?`)) return;
    setError("");
    setSuccessMsg("");
    try {
      await apiFetch(`/api/admin/companies/${id}/reject`, {
        method: "PATCH",
      });
      setSuccessMsg(`Successfully rejected registration for ${name}.`);
      loadPending();
    } catch (err) {
      setError(err.message || "Failed to reject company.");
    }
  };

  if (loading) {
    return <div style={{ color: "var(--color-text-secondary)" }}>Loading pending approvals...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-navy-dark)", marginBottom: "0.25rem" }}>
          Pending Recruiter Approvals
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          Verify company identity, website, and recruiter details before approving.
        </p>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {companies.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--color-text-secondary)" }}>
          <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>No recruiter accounts are pending approval.</p>
          <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
            All registered corporate representatives are verified and active.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {companies.map((company) => (
            <div key={company.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--color-navy-dark)" }}>
                    {company.company_name}
                  </h3>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "0.825rem", color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}
                  >
                    {company.website}
                  </a>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleApprove(company.id, company.company_name)}
                    className="btn btn-success"
                    style={{ padding: "0.4rem 0.75rem" }}
                  >
                    Approve Recruiter
                  </button>
                  <button
                    onClick={() => handleReject(company.id, company.company_name)}
                    className="btn btn-danger"
                    style={{ padding: "0.4rem 0.75rem" }}
                  >
                    Reject Registration
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", borderTop: "1px solid var(--color-border)", paddingTop: "1rem", fontSize: "0.875rem" }}>
                <div>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                    HR Representative
                  </span>
                  <strong>{company.hr_contact_name}</strong>
                </div>

                <div>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                    HR Phone Number
                  </span>
                  <strong className="mono">{company.hr_contact_phone}</strong>
                </div>

                <div>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                    HR Account Email
                  </span>
                  <strong>{company.user?.email}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default ApproveCompanies;
