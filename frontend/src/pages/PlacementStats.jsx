import React, { useEffect, useState } from "react";
import { apiFetch } from "../utils/api";

export const PlacementStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await apiFetch("/api/stats/overview");
        setStats(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load placement stats overview.");
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", color: "var(--color-text-secondary)" }}>
        Loading stats dashboard...
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-navy-dark)", marginBottom: "0.25rem" }}>
          Campus Placement Statistics
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          Official, audited placement records for the current academic session
        </p>
      </div>

      {/* Overview Cards */}
      <div className="dashboard-grid">
        <div className="card" style={{ borderLeft: "4px solid var(--color-primary)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>
            Total Registered Students
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-navy-dark)", marginTop: "0.5rem", fontFamily: "var(--font-mono)" }}>
            {stats.total_students}
          </div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid var(--color-success)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>
            Students Placed
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-success)", marginTop: "0.5rem", fontFamily: "var(--font-mono)" }}>
            {stats.total_placed}
          </div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid #8b5cf6" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>
            Overall Placement Rate
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "#8b5cf6", marginTop: "0.5rem", fontFamily: "var(--font-mono)" }}>
            {stats.overall_placement_rate}%
          </div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid var(--color-warning)" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>
            Recruitment Partners
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--color-warning)", marginTop: "0.5rem", fontFamily: "var(--font-mono)" }}>
            {stats.total_companies}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }} className="form-row">
        {/* Branch-wise breakdown */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 className="card-title" style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
            Branch Wise Placement Records
          </h3>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Branch</th>
                  <th style={{ textAlign: "right" }}>Registered</th>
                  <th style={{ textAlign: "right" }}>Placed</th>
                  <th style={{ textAlign: "right" }}>Placement %</th>
                </tr>
              </thead>
              <tbody>
                {stats.branch_stats.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", color: "var(--color-text-secondary)", fontStyle: "italic" }}>
                      No branch placement details recorded.
                    </td>
                  </tr>
                ) : (
                  stats.branch_stats.map((b) => (
                    <tr key={b.branch}>
                      <td className="mono" style={{ fontWeight: 600 }}>{b.branch}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{b.total_students}</td>
                      <td className="mono" style={{ textAlign: "right" }}>{b.placed_students}</td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 600, color: b.placement_rate > 75 ? "var(--color-success)" : "var(--color-text-primary)" }}>
                        {b.placement_rate}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Offers list */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <h3 className="card-title" style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
            Top Placement Packages (LPA)
          </h3>
          <div className="table-container" style={{ margin: 0 }}>
            <table className="dense-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Branch</th>
                  <th>Company</th>
                  <th style={{ textAlign: "right" }}>Package (LPA)</th>
                </tr>
              </thead>
              <tbody>
                {stats.top_offers.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", color: "var(--color-text-secondary)", fontStyle: "italic" }}>
                      No selections recorded yet.
                    </td>
                  </tr>
                ) : (
                  stats.top_offers.map((offer, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 500 }}>{offer.student_name}</td>
                      <td className="mono">{offer.branch}</td>
                      <td>{offer.company_name}</td>
                      <td className="mono" style={{ textAlign: "right", fontWeight: 700, color: "var(--color-primary)" }}>
                        {offer.package_lpa.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PlacementStats;
