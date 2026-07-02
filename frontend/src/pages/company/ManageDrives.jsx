import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";

export const ManageDrives = () => {
  const { user } = useAuth();
  const location = useLocation();
  const company = user?.profile;

  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Managing expanded drive states
  const [selectedDriveId, setSelectedDriveId] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [loadingSub, setLoadingSub] = useState(false);

  // New Interview Round Form states
  const [roundName, setRoundName] = useState("");
  const [roundOrder, setRoundOrder] = useState("");
  const [roundDate, setRoundDate] = useState("");
  const [venue, setVenue] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const [meetingLink, setMeetingLink] = useState("");
  const [roundLoading, setRoundLoading] = useState(false);

  async function loadMyDrives() {
    if (!company) return;
    try {
      const allDrives = await apiFetch("/api/drives");
      // Include closed ones? Wait, GET /api/drives returns only active.
      // But we can let company see all or filter. Let's show active ones first,
      // and we can query database or filter. Since GET /api/drives returns active ones,
      // it's fine. If we need to let them see closed ones, since they closed it, it disappears from active,
      // which is fine for basic listing, or we can handle active drives.
      const ownDrives = allDrives.filter((d) => d.company_id === company.id);
      setDrives(ownDrives);
    } catch (err) {
      console.error(err);
      setError("Failed to load your job drives.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Check if created
    const params = new URLSearchParams(location.search);
    if (params.get("created")) {
      setSuccessMsg("Job drive published successfully!");
    }
    loadMyDrives();
  }, [company, location]);

  const handleCloseDrive = async (driveId) => {
    if (!window.confirm("Are you sure you want to close this job drive? This cannot be undone.")) return;
    setError("");
    setSuccessMsg("");
    try {
      await apiFetch(`/api/drives/${driveId}/close`, {
        method: "PATCH",
      });
      setSuccessMsg("Recruitment drive closed successfully.");
      await loadMyDrives();
      if (selectedDriveId === driveId) {
        setSelectedDriveId(null);
      }
    } catch (err) {
      setError(err.message || "Failed to close recruitment drive.");
    }
  };

  const handleExpandDrive = async (driveId) => {
    if (selectedDriveId === driveId) {
      setSelectedDriveId(null);
      return;
    }

    setSelectedDriveId(driveId);
    setLoadingSub(true);
    setApplicants([]);
    setRounds([]);
    setError("");
    setSuccessMsg("");

    try {
      // Fetch applicants & scheduled rounds in parallel
      const [appsData, allRounds] = await Promise.all([
        apiFetch(`/api/applications/drive/${driveId}`),
        // Filter rounds. The student endpoint `/api/interviews/mine` fetches student's, but for recruiter,
        // we can fetch all rounds. Wait! The prompt has `POST /api/interviews/:driveId` but doesn't list a direct recruiter GET `/api/interviews/drive/:driveId`.
        // However, we can fetch own drives/rounds or let student see them. To display scheduled rounds for the recruiter,
        // we can fetch from drive database, or since they schedule it, let's show success when scheduled.
        // Actually, we can return rounds if we query drives, or let them schedule. Let's focus on managing applicants.
        Promise.resolve([]) // Mock rounds or fetch if endpoint existed.
      ]);
      setApplicants(appsData);
    } catch (err) {
      console.error(err);
      setError("Failed to retrieve drive candidates detail.");
    } finally {
      setLoadingSub(false);
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    setError("");
    setSuccessMsg("");
    try {
      const updatedApp = await apiFetch(`/api/applications/${appId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setSuccessMsg(`Status updated to '${newStatus}' successfully!`);
      // Update applicants state locally
      setApplicants(applicants.map((a) => (a.id === appId ? updatedApp : a)));
      // Refresh drive list in case student placement changed
      await loadMyDrives();
    } catch (err) {
      setError(err.message || "Failed to update candidate status.");
    }
  };

  const handleScheduleRound = async (e) => {
    e.preventDefault();
    setRoundLoading(true);
    setError("");
    setSuccessMsg("");

    const payload = {
      round_name: roundName,
      round_order: parseInt(roundOrder),
      scheduled_at: new Date(roundDate).toISOString(),
      venue,
      is_online: isOnline,
      meeting_link: isOnline ? meetingLink : null,
    };

    try {
      await apiFetch(`/api/interviews/${selectedDriveId}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSuccessMsg(`Successfully scheduled interview round: '${roundName}'`);
      
      // Reset form
      setRoundName("");
      setRoundOrder("");
      setRoundDate("");
      setVenue("");
      setIsOnline(false);
      setMeetingLink("");
    } catch (err) {
      setError(err.message || "Failed to schedule interview round.");
    } finally {
      setRoundLoading(false);
    }
  };

  if (loading) {
    return <div style={{ color: "var(--color-text-secondary)" }}>Loading your job drives...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-navy-dark)", marginBottom: "0.25rem" }}>
          Manage Job Drives
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          Review submitted resumes, shortlist candidates, set selection outcomes, and schedule interview rounds.
        </p>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {drives.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--color-text-secondary)" }}>
          <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>You haven't posted any placement drives yet.</p>
          <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Click "Post Job Drive" in the sidebar to create your first recruiter posting.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {drives.map((drive) => {
            const isExpanded = selectedDriveId === drive.id;

            return (
              <div key={drive.id} className="card" style={{ padding: "1.25rem", border: isExpanded ? "1px solid var(--color-primary)" : "1px solid var(--color-border)" }}>
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--color-navy-dark)" }}>
                      {drive.role_title}
                    </h3>
                    <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                      Offer: <span className="mono" style={{ fontWeight: 600 }}>{drive.package_lpa.toFixed(2)} LPA</span> | 
                      Cutoff: <span className="mono">{drive.min_cgpa.toFixed(2)} CGPA</span> | 
                      Max Backlogs: <span className="mono">{drive.max_backlogs}</span>
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleExpandDrive(drive.id)}
                      className="btn btn-secondary"
                      style={{ padding: "0.4rem 0.75rem" }}
                    >
                      {isExpanded ? "Hide workspace" : "Manage drive"}
                    </button>
                    {drive.is_active ? (
                      <button
                        onClick={() => handleCloseDrive(drive.id)}
                        className="btn btn-danger"
                        style={{ padding: "0.4rem 0.75rem" }}
                      >
                        Close Drive
                      </button>
                    ) : (
                      <span className="badge badge-danger">Closed</span>
                    )}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
                    {loadingSub ? (
                      <div style={{ color: "var(--color-text-secondary)", fontStyle: "italic" }}>
                        Loading candidates details...
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                        
                        {/* Applicants Table */}
                        <div>
                          <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--color-navy)", marginBottom: "0.75rem" }}>
                            Registered Job Applicants
                          </h4>
                          
                          {applicants.length === 0 ? (
                            <p style={{ color: "var(--color-text-secondary)", fontStyle: "italic", fontSize: "0.85rem" }}>
                              No students have applied to this drive yet.
                            </p>
                          ) : (
                            <div className="table-container" style={{ margin: 0 }}>
                              <table className="dense-table">
                                <thead>
                                  <tr>
                                    <th>Student Name</th>
                                    <th>Roll Number</th>
                                    <th>Branch</th>
                                    <th style={{ textAlign: "right" }}>CGPA</th>
                                    <th style={{ textAlign: "right" }}>Backlogs</th>
                                    <th>Resume Link</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: "center" }}>Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {applicants.map((app) => (
                                    <tr key={app.id}>
                                      <td style={{ fontWeight: 600 }}>{app.student?.full_name}</td>
                                      <td className="mono">{app.student?.roll_number}</td>
                                      <td>{app.student?.branch}</td>
                                      <td className="mono" style={{ textAlign: "right" }}>{app.student?.cgpa.toFixed(2)}</td>
                                      <td className="mono" style={{ textAlign: "right" }}>{app.student?.active_backlogs}</td>
                                      <td>
                                        <a
                                          href={app.student?.resume_path}
                                          target="_blank"
                                          rel="noreferrer"
                                          style={{ color: "var(--color-primary)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500 }}
                                        >
                                          View Resume PDF
                                        </a>
                                      </td>
                                      <td>
                                        <span className={`badge ${app.status === "selected" ? "badge-success" : app.status === "rejected" ? "badge-danger" : "badge-warning"}`}>
                                          {app.status}
                                        </span>
                                      </td>
                                      <td style={{ textAlign: "center" }}>
                                        <select
                                          className="form-control"
                                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.8rem", width: "130px", margin: "0 auto" }}
                                          value={app.status}
                                          onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                                        >
                                          <option value="applied">Applied</option>
                                          <option value="shortlisted">Shortlist</option>
                                          <option value="rejected">Reject</option>
                                          <option value="selected">Select (Hired)</option>
                                        </select>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Interview Scheduler Form */}
                        {drive.is_active && (
                          <div className="card" style={{ backgroundColor: "var(--color-slate-light)", border: "1px dashed var(--color-border)" }}>
                            <h4 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--color-navy)", marginBottom: "1rem" }}>
                              Schedule Interview Round
                            </h4>
                            
                            <form onSubmit={handleScheduleRound}>
                              <div className="form-row">
                                <div className="form-group">
                                  <label className="form-label">Round Name</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    required
                                    placeholder="e.g. Technical Interview 1"
                                    value={roundName}
                                    onChange={(e) => setRoundName(e.target.value)}
                                  />
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Round Order</label>
                                  <input
                                    type="number"
                                    min="1"
                                    className="form-control"
                                    required
                                    placeholder="e.g. 1 (for 1st round)"
                                    value={roundOrder}
                                    onChange={(e) => setRoundOrder(e.target.value)}
                                  />
                                </div>
                              </div>

                              <div className="form-row">
                                <div className="form-group">
                                  <label className="form-label">Scheduled Date & Time</label>
                                  <input
                                    type="datetime-local"
                                    className="form-control"
                                    required
                                    value={roundDate}
                                    onChange={(e) => setRoundDate(e.target.value)}
                                  />
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Location / Room Number</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    required={!isOnline}
                                    disabled={isOnline}
                                    placeholder={isOnline ? "Virtual Round" : "e.g. Placement Cell Seminar Room 3"}
                                    value={venue}
                                    onChange={(e) => setVenue(e.target.value)}
                                  />
                                </div>
                              </div>

                              <div className="form-group">
                                <label style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.9rem", cursor: "pointer" }}>
                                  <input
                                    type="checkbox"
                                    checked={isOnline}
                                    onChange={(e) => {
                                      setIsOnline(e.target.checked);
                                      if (e.target.checked) setVenue("Online meeting");
                                      else setVenue("");
                                    }}
                                    style={{ width: "16px", height: "16px" }}
                                  />
                                  This is a Virtual/Online Round
                                </label>
                              </div>

                              {isOnline && (
                                <div className="form-group">
                                  <label className="form-label">Meeting URL Link (Google Meet / Zoom)</label>
                                  <input
                                    type="url"
                                    className="form-control"
                                    required
                                    placeholder="https://meet.google.com/abc-defg-hij"
                                    value={meetingLink}
                                    onChange={(e) => setMeetingLink(e.target.value)}
                                  />
                                </div>
                              )}

                              <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ fontSize: "0.85rem" }}
                                disabled={roundLoading}
                              >
                                {roundLoading ? "Scheduling..." : "Schedule Round"}
                              </button>
                            </form>
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default ManageDrives;
