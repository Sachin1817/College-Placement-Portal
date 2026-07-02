import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";
import { checkEligibility } from "../../utils/eligibility";
import { EligibleBadge } from "../../components/EligibleBadge";

// Days until deadline
const daysUntil = (dateStr) => {
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Company initials avatar
const CompanyAvatar = ({ name }) => {
  const initials = name
    ?.split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";
  const colors = [
    ["#6366F1","#4F46E5"], ["#06B6D4","#0891B2"], ["#10B981","#059669"],
    ["#F59E0B","#D97706"], ["#EF4444","#DC2626"], ["#8B5CF6","#7C3AED"],
  ];
  const idx = (name?.charCodeAt(0) || 0) % colors.length;
  return (
    <div style={{
      width: 48, height: 48, borderRadius: 12, flexShrink: 0,
      background: `linear-gradient(135deg, ${colors[idx][0]}, ${colors[idx][1]})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "1rem", fontWeight: 800, color: "#fff",
      boxShadow: `0 4px 12px ${colors[idx][0]}55`,
    }}>
      {initials}
    </div>
  );
};

const DeadlinePill = ({ deadline }) => {
  const days = daysUntil(deadline);
  const urgent = days <= 3;
  const soon   = days <= 7;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "0.2rem 0.6rem", borderRadius: 99,
      fontSize: "0.72rem", fontWeight: 700,
      background: urgent ? "#FEE2E2" : soon ? "#FEF3C7" : "#F0FDF4",
      color:   urgent ? "#991B1B"  : soon ? "#92400E"  : "#065F46",
      border: `1px solid ${urgent ? "#FECACA" : soon ? "#FDE68A" : "#BBF7D0"}`,
    }}>
      {urgent ? "🔥" : soon ? "⏰" : "📅"}
      {days > 0 ? `${days}d left` : "Closing soon"}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    applied:     { bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE", label: "⏳ Applied" },
    shortlisted: { bg: "#FEF3C7", color: "#92400E", border: "#FDE68A", label: "⭐ Shortlisted" },
    selected:    { bg: "#D1FAE5", color: "#065F46", border: "#6EE7B7", label: "🏆 Selected" },
    rejected:    { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA", label: "✕ Rejected" },
  };
  const s = map[status] || map.applied;
  return (
    <span style={{
      padding: "0.25rem 0.7rem", borderRadius: 99,
      fontSize: "0.72rem", fontWeight: 700,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
};

export const BrowseDrives = () => {
  const { user } = useAuth();
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedDesc, setExpandedDesc] = useState({});

  useEffect(() => {
    async function loadData() {
      try {
        const [drivesData, appsData] = await Promise.all([
          apiFetch("/api/drives"),
          apiFetch("/api/applications/mine"),
        ]);
        setDrives(drivesData);
        setApplications(appsData);
      } catch (err) {
        setError("Failed to fetch placement drives.");
      } finally {
        setLoading(false);
      }
    }
    if (user?.profile) loadData();
  }, [user]);

  const handleApply = async (driveId) => {
    setError(""); setSuccessMsg("");
    if (!user.profile?.resume_path) {
      setError("Please upload a PDF resume in 'Profile & Resume' before applying.");
      return;
    }
    setActionLoading(driveId);
    try {
      await apiFetch(`/api/applications/${driveId}`, { method: "POST" });
      setSuccessMsg("🎉 Application submitted successfully!");
      const updated = await apiFetch("/api/applications/mine");
      setApplications(updated);
    } catch (err) {
      setError(err.message || "Failed to submit application.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {[1,2,3].map(i => (
          <div key={i} className="card">
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <div className="skeleton" style={{ height: 18, width: "40%", borderRadius: 4 }} />
                <div className="skeleton" style={{ height: 14, width: "25%", borderRadius: 4 }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.75rem", marginTop: "1rem" }}>
              {[1,2,3,4].map(j => <div key={j} className="skeleton" style={{ height: 48, borderRadius: 8 }} />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const studentProfile = user?.profile;
  const isVerified = user?.profile?.user?.is_verified;
  const eligibleCount = drives.filter(d => checkEligibility(studentProfile, d).eligible).length;
  const appliedCount = applications.length;

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.5px", marginBottom: "0.25rem" }}>
          Active Recruitment Drives
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          Browse open drives and apply instantly. Eligibility is validated in real-time.
        </p>
      </div>

      {/* Summary Pills */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <span style={{ padding: "0.35rem 0.9rem", borderRadius: 99, background: "var(--color-primary-light)", color: "var(--color-primary-dark)", fontSize: "0.8rem", fontWeight: 700, border: "1px solid rgba(99,102,241,0.2)" }}>
          💼 {drives.length} Active Drives
        </span>
        <span style={{ padding: "0.35rem 0.9rem", borderRadius: 99, background: "#D1FAE5", color: "#065F46", fontSize: "0.8rem", fontWeight: 700, border: "1px solid #6EE7B7" }}>
          ✅ {eligibleCount} You Qualify For
        </span>
        <span style={{ padding: "0.35rem 0.9rem", borderRadius: 99, background: "#F0F9FF", color: "#0369A1", fontSize: "0.8rem", fontWeight: 700, border: "1px solid #BAE6FD" }}>
          📋 {appliedCount} Applied
        </span>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ borderLeft: "4px solid var(--color-success)" }}>
          {successMsg}
        </div>
      )}
      {error && (
        <div className="alert alert-danger" style={{ borderLeft: "4px solid var(--color-danger)" }}>
          {error}{" "}
          {error.includes("resume") && (
            <Link to="/profile" style={{ color: "var(--color-danger)", fontWeight: 700, textDecoration: "underline" }}>
              Upload now →
            </Link>
          )}
        </div>
      )}

      {drives.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No active drives right now</h3>
          <p>Check back later — companies post new drives regularly.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {drives.map((drive) => {
            const hasApplied = applications.some((a) => a.drive_id === drive.id);
            const appDetails = applications.find((a) => a.drive_id === drive.id);
            const eligResult = checkEligibility(studentProfile, drive);
            const isEligible = eligResult.eligible;
            const canApply = isEligible && isVerified && !hasApplied;
            const isExpanded = expandedDesc[drive.id];

            return (
              <div
                key={drive.id}
                style={{
                  background: "#fff",
                  border: `1px solid ${hasApplied ? "rgba(99,102,241,0.2)" : "var(--color-border)"}`,
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: hasApplied
                    ? "0 4px 20px rgba(99,102,241,0.08)"
                    : "var(--shadow-sm)",
                  transition: "transform 0.18s ease, box-shadow 0.18s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = hasApplied ? "0 4px 20px rgba(99,102,241,0.08)" : "var(--shadow-sm)"; }}
              >
                {/* Top gradient bar based on eligibility */}
                <div style={{
                  height: 3,
                  background: hasApplied
                    ? "linear-gradient(90deg, #6366F1, #06B6D4)"
                    : isEligible
                    ? "linear-gradient(90deg, #10B981, #06B6D4)"
                    : "linear-gradient(90deg, #E2E8F0, #E2E8F0)",
                }} />

                <div style={{ padding: "1.5rem" }}>
                  {/* Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                    <div style={{ display: "flex", gap: "0.875rem", alignItems: "flex-start", flex: 1 }}>
                      <CompanyAvatar name={drive.company?.company_name} />
                      <div>
                        <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.3px", marginBottom: "0.2rem" }}>
                          {drive.role_title}
                        </h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                            {drive.company?.company_name}
                          </span>
                          <span style={{ color: "var(--color-border)" }}>•</span>
                          <a
                            href={drive.company?.website}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: "0.78rem", color: "var(--color-primary)", fontWeight: 600 }}
                          >
                            Visit Website ↗
                          </a>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <DeadlinePill deadline={drive.application_deadline} />
                      {hasApplied
                        ? <StatusBadge status={appDetails?.status} />
                        : <EligibleBadge eligible={isEligible} reasons={eligResult.reasons} />
                      }
                    </div>
                  </div>

                  {/* Metrics row */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: "0.75rem",
                    marginBottom: "1.25rem",
                  }}>
                    {[
                      { label: "Package", value: `₹${drive.package_lpa.toFixed(2)} LPA`, icon: "💰", highlight: true },
                      { label: "Min CGPA", value: drive.min_cgpa.toFixed(2), icon: "🎓" },
                      { label: "Max Backlogs", value: drive.max_backlogs, icon: "📝" },
                      { label: "Deadline", value: new Date(drive.application_deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), icon: "📅" },
                    ].map((m) => (
                      <div key={m.label} style={{
                        background: m.highlight ? "linear-gradient(135deg, #EEF2FF, #E0F2FE)" : "var(--color-bg)",
                        border: `1px solid ${m.highlight ? "rgba(99,102,241,0.15)" : "var(--color-border)"}`,
                        borderRadius: 10,
                        padding: "0.75rem 1rem",
                        textAlign: "center",
                      }}>
                        <div style={{ fontSize: "1.25rem", marginBottom: "0.2rem" }}>{m.icon}</div>
                        <div style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.95rem",
                          fontWeight: 800,
                          color: m.highlight ? "var(--color-primary-dark)" : "var(--color-text-primary)",
                        }}>
                          {m.value}
                        </div>
                        <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-text-muted)", marginTop: "0.1rem" }}>
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Description */}
                  {drive.description && (
                    <div style={{ marginBottom: "1rem" }}>
                      <p style={{
                        fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: 1.7,
                        display: "-webkit-box", WebkitBoxOrient: "vertical",
                        WebkitLineClamp: isExpanded ? "none" : 2,
                        overflow: "hidden",
                      }}>
                        {drive.description}
                      </p>
                      {drive.description.length > 120 && (
                        <button
                          onClick={() => setExpandedDesc(p => ({ ...p, [drive.id]: !p[drive.id] }))}
                          style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", padding: "0.25rem 0", marginTop: "0.25rem" }}
                        >
                          {isExpanded ? "Show less ↑" : "Read more ↓"}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Branches & Years tags */}
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                    {drive.eligible_branches.map(b => (
                      <span key={b} className="tag">{b}</span>
                    ))}
                    {drive.eligible_grad_years.map(y => (
                      <span key={y} style={{
                        display: "inline-block", padding: "0.15rem 0.5rem",
                        background: "#F0FDF4", color: "#065F46",
                        borderRadius: 4, fontSize: "0.72rem", fontWeight: 600, margin: "0.15rem",
                        border: "1px solid #BBF7D0",
                      }}>
                        {y} Batch
                      </span>
                    ))}
                  </div>

                  {/* Action row */}
                  <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.75rem", borderTop: "1px solid var(--color-border)", paddingTop: "1.25rem" }}>
                    {hasApplied ? (
                      <>
                        <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                          Applied {appDetails?.applied_at ? new Date(appDetails.applied_at).toLocaleDateString("en-IN") : ""}
                        </span>
                        <button className="btn btn-secondary" disabled>
                          ✓ Applied
                        </button>
                      </>
                    ) : (
                      <>
                        {!isVerified && (
                          <span style={{ fontSize: "0.78rem", color: "var(--color-warning)", fontWeight: 600 }}>
                            ⚠ Account pending verification
                          </span>
                        )}
                        <button
                          className="btn btn-primary"
                          onClick={() => handleApply(drive.id)}
                          disabled={!canApply || actionLoading === drive.id}
                          style={{ minWidth: 160, justifyContent: "center" }}
                        >
                          {actionLoading === drive.id ? (
                            <>
                              <span style={{
                                display: "inline-block", width: 12, height: 12,
                                border: "2px solid rgba(255,255,255,0.4)",
                                borderTopColor: "#fff", borderRadius: "50%",
                                animation: "spin 0.6s linear infinite",
                              }} />
                              Submitting...
                            </>
                          ) : !isVerified
                            ? "Pending Verification"
                            : !isEligible
                            ? "Not Eligible"
                            : "Apply Now →"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
export default BrowseDrives;
