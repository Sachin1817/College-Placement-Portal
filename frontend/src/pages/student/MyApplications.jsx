import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

export const MyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadApplications() {
      try {
        const data = await apiFetch("/api/applications/mine");
        setApplications(data);
      } catch (err) {
        console.error(err);
        setError("Failed to retrieve your job applications.");
      } finally {
        setLoading(false);
      }
    }

    loadApplications();
  }, []);

  if (loading) {
    return <div style={{ color: "var(--color-text-secondary)" }}>Loading your applications...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-navy-dark)", marginBottom: "0.25rem" }}>
          My Job Applications
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          Track the evaluation status of all placement drives you have applied to
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--color-text-secondary)" }}>
          <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>You haven't submitted any job applications yet.</p>
          <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Visit the "Recruitment Drives" page to browse open roles and apply.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="dense-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Role Title</th>
                <th style={{ textAlign: "right" }}>Package (LPA)</th>
                <th>Applied Date</th>
                <th style={{ textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => {
                let statusBadgeClass = "badge-warning";
                if (app.status === "selected") statusBadgeClass = "badge-success";
                if (app.status === "rejected") statusBadgeClass = "badge-danger";

                return (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 600 }}>{app.drive?.company?.company_name}</td>
                    <td>{app.drive?.role_title}</td>
                    <td className="mono" style={{ textAlign: "right", fontWeight: 500 }}>
                      {app.drive?.package_lpa.toFixed(2)} LPA
                    </td>
                    <td className="mono">{new Date(app.applied_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`badge ${statusBadgeClass}`} style={{ minWidth: "90px", textAlign: "center", display: "inline-block" }}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default MyApplications;
