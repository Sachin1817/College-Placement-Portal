import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

export const InterviewSchedule = () => {
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSchedule() {
      try {
        const data = await apiFetch("/api/interviews/mine");
        setRounds(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load interview schedule.");
      } finally {
        setLoading(false);
      }
    }

    loadSchedule();
  }, []);

  if (loading) {
    return <div style={{ color: "var(--color-text-secondary)" }}>Loading interview schedule...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  // Filter into upcoming and past
  const now = new Date();
  const upcomingRounds = rounds.filter((r) => new Date(r.scheduled_at) >= now);
  const pastRounds = rounds.filter((r) => new Date(r.scheduled_at) < now);

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-navy-dark)", marginBottom: "0.25rem" }}>
          My Interview Schedule
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          Stay updated on scheduled interview rounds and join links
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Upcoming interviews */}
        <div className="card">
          <h3 className="card-title" style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "var(--color-navy)" }}>
            Upcoming Rounds
          </h3>
          
          {upcomingRounds.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontStyle: "italic", fontSize: "0.9rem" }}>
              No upcoming interview rounds scheduled.
            </p>
          ) : (
            <div className="table-container" style={{ margin: 0 }}>
              <table className="dense-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Drive / Job Role</th>
                    <th>Round name</th>
                    <th>Date & Time</th>
                    <th>Location / Link</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingRounds.map((round) => (
                    <tr key={round.id}>
                      <td style={{ fontWeight: 600 }}>{round.drive?.company?.company_name}</td>
                      <td>{round.drive?.role_title}</td>
                      <td style={{ fontWeight: 500 }}>{round.round_name}</td>
                      <td className="mono">{new Date(round.scheduled_at).toLocaleString()}</td>
                      <td>
                        {round.is_online ? (
                          <a
                            href={round.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", textDecoration: "none" }}
                          >
                            Join Online Meeting
                          </a>
                        ) : (
                          <span style={{ fontSize: "0.85rem", color: "var(--color-text-primary)" }}>
                            Venue: {round.venue}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* History */}
        <div className="card" style={{ opacity: 0.85 }}>
          <h3 className="card-title" style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
            Past Rounds
          </h3>
          
          {pastRounds.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontStyle: "italic", fontSize: "0.9rem" }}>
              No historical rounds recorded.
            </p>
          ) : (
            <div className="table-container" style={{ margin: 0 }}>
              <table className="dense-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Job Role</th>
                    <th>Round name</th>
                    <th>Date & Time</th>
                    <th>Venue</th>
                  </tr>
                </thead>
                <tbody>
                  {pastRounds.map((round) => (
                    <tr key={round.id}>
                      <td>{round.drive?.company?.company_name}</td>
                      <td>{round.drive?.role_title}</td>
                      <td>{round.round_name}</td>
                      <td className="mono">{new Date(round.scheduled_at).toLocaleDateString()}</td>
                      <td>{round.is_online ? "Online" : round.venue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default InterviewSchedule;
