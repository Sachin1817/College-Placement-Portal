import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";
import { checkEligibility } from "../../utils/eligibility";

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [drivesData, appsData, interviewsData] = await Promise.all([
          apiFetch("/api/drives"),
          apiFetch("/api/applications/mine"),
          apiFetch("/api/interviews/mine"),
        ]);
        setDrives(drivesData);
        setApplications(appsData);
        setInterviews(interviewsData);
      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    if (user?.profile) loadDashboardData();
    else setLoading(false);
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "1rem" }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="card" style={{ height: 120 }}>
              <div className="skeleton" style={{ height: 14, width: "50%", borderRadius: 4, marginBottom: "0.75rem" }} />
              <div className="skeleton" style={{ height: 36, width: "40%", borderRadius: 4 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) return <div className="alert alert-danger">{error}</div>;

  const studentProfile = user?.profile;
  const isVerified = studentProfile?.user?.is_verified;
  const eligibleDrives = drives.filter(d => checkEligibility(studentProfile, d).eligible);
  const upcomingInterviews = interviews.filter(i => new Date(i.scheduled_at) >= new Date());
  const shortlisted = applications.filter(a => a.status === "shortlisted").length;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      {/* Welcome Hero */}
      <div style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
        borderRadius: 20,
        padding: "2rem 2.25rem",
        marginBottom: "1.75rem",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background decoration */}
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 200, height: 200,
          background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", bottom: -30, left: "30%",
          width: 150, height: 150,
          background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)",
          borderRadius: "50%",
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.25rem" }}>
            {greeting()},
          </p>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.5px", marginBottom: "0.5rem" }}>
            {studentProfile?.full_name || "Student"} 👋
          </h1>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-mono)" }}>
              📌 {studentProfile?.roll_number}
            </span>
            <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.55)" }}>
              🏛 {studentProfile?.branch} · {studentProfile?.graduation_year}
            </span>
            <span style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", fontFamily: "var(--font-mono)" }}>
              📊 CGPA {studentProfile?.cgpa?.toFixed(2)}
            </span>
          </div>

          {studentProfile?.placed && (
            <div style={{
              marginTop: "1rem", display: "inline-flex", alignItems: "center", gap: "0.5rem",
              background: "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(6,182,212,0.2))",
              border: "1px solid rgba(16,185,129,0.4)",
              borderRadius: 99, padding: "0.4rem 1rem",
              fontSize: "0.85rem", fontWeight: 700, color: "#6EE7B7",
            }}>
              🏆 Congratulations — You are Placed!
            </div>
          )}
        </div>
      </div>

      {/* Verification warning */}
      {!isVerified && (
        <div className="alert alert-warning" style={{ borderLeft: "4px solid var(--color-warning)", marginBottom: "1.5rem" }}>
          <strong>⏳ Verification Pending</strong>
          <span style={{ display: "block", marginTop: "0.25rem", fontSize: "0.85rem" }}>
            Your profile hasn't been verified by the TPO office yet. You can browse drives but cannot apply until verified.
          </span>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        {[
          {
            icon: "💼", label: "Eligible Drives",
            value: studentProfile?.placed ? "—" : eligibleDrives.length,
            sub: "matching your profile", color: "#6366F1", bg: "#EEF2FF",
            link: "/drives",
          },
          {
            icon: "📋", label: "Applications",
            value: applications.length,
            sub: `${shortlisted} shortlisted`, color: "#10B981", bg: "#D1FAE5",
            link: "/applications",
          },
          {
            icon: "📅", label: "Upcoming Interviews",
            value: upcomingInterviews.length,
            sub: "scheduled rounds", color: "#F59E0B", bg: "#FEF3C7",
            link: "/interviews",
          },
          {
            icon: "📊", label: "Your CGPA",
            value: studentProfile?.cgpa?.toFixed(2),
            sub: `${studentProfile?.active_backlogs || 0} active backlogs`, color: "#06B6D4", bg: "#ECFEFF",
            link: "/profile",
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            to={stat.link}
            style={{ textDecoration: "none" }}
          >
            <div style={{
              background: "#fff",
              border: "1px solid var(--color-border)",
              borderTop: `3px solid ${stat.color}`,
              borderRadius: 14,
              padding: "1.25rem 1.5rem",
              boxShadow: "var(--shadow-sm)",
              transition: "transform 0.18s ease, box-shadow 0.18s ease",
              cursor: "pointer",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: stat.bg, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "1.1rem", marginBottom: "0.75rem",
              }}>
                {stat.icon}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-1px", lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-text-secondary)", marginTop: "0.3rem" }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "0.2rem" }}>
                {stat.sub}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Lower Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.25rem", alignItems: "start" }}>
        {/* Placement Checklist */}
        <div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 16, padding: "1.5rem", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 800, marginBottom: "1.25rem", color: "var(--color-text-primary)" }}>
            Placement Checklist
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
            {[
              {
                done: !!studentProfile?.resume_path,
                title: "Upload PDF Resume",
                desc: studentProfile?.resume_path ? "Resume uploaded and ready" : "Required to apply for drives",
                link: "/profile",
                icon: "📄",
              },
              {
                done: !!isVerified,
                title: "Account Verification",
                desc: isVerified ? "Verified by TPO Office ✓" : "Waiting for admin approval",
                icon: "✅",
              },
              {
                done: applications.length > 0,
                title: "Apply to Job Drives",
                desc: applications.length > 0 ? `${applications.length} application(s) submitted` : "Browse and apply to matching drives",
                link: "/drives",
                icon: "💼",
              },
              {
                done: shortlisted > 0,
                title: "Get Shortlisted",
                desc: shortlisted > 0 ? `Shortlisted in ${shortlisted} drive(s)` : "Companies will shortlist eligible applicants",
                icon: "⭐",
              },
            ].map((item, idx, arr) => (
              <div key={item.title} style={{
                display: "flex", alignItems: "flex-start", gap: "1rem",
                padding: "1rem 0",
                borderBottom: idx < arr.length - 1 ? "1px solid var(--color-border)" : "none",
              }}>
                {/* Step indicator */}
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: item.done ? "linear-gradient(135deg, #10B981, #059669)" : "var(--color-bg)",
                  border: `2px solid ${item.done ? "#10B981" : "var(--color-border)"}`,
                  fontSize: "0.85rem",
                  color: item.done ? "#fff" : "var(--color-text-muted)",
                }}>
                  {item.done ? "✓" : item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: item.done ? "var(--color-text-primary)" : "var(--color-text-secondary)" }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "0.1rem" }}>
                    {item.desc}
                  </div>
                </div>
                {item.link && !item.done && (
                  <Link to={item.link} style={{
                    fontSize: "0.78rem", fontWeight: 700, color: "var(--color-primary)",
                    background: "var(--color-primary-light)", border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: 6, padding: "0.25rem 0.6rem", whiteSpace: "nowrap",
                  }}>
                    Go →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tips Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{
            background: "linear-gradient(135deg, #EEF2FF, #E0F2FE)",
            border: "1px solid rgba(99,102,241,0.15)",
            borderRadius: 16, padding: "1.5rem",
          }}>
            <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>💡</div>
            <h4 style={{ fontWeight: 800, fontSize: "0.9rem", color: "var(--color-primary-dark)", marginBottom: "0.4rem" }}>
              TPO Tip of the Day
            </h4>
            <p style={{ fontSize: "0.82rem", color: "#374151", lineHeight: 1.7 }}>
              Keep your CGPA and backlog count up-to-date! Eligibility is computed in real-time — an outdated profile may hide drives you actually qualify for.
            </p>
          </div>

          {/* Quick links */}
          <div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 16, padding: "1.25rem", boxShadow: "var(--shadow-sm)" }}>
            <h4 style={{ fontWeight: 800, fontSize: "0.85rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.875rem" }}>
              Quick Actions
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                { icon: "💼", label: "Browse Open Drives", to: "/drives", color: "#6366F1" },
                { icon: "📋", label: "Track Applications", to: "/applications", color: "#10B981" },
                { icon: "📅", label: "Interview Schedule", to: "/interviews", color: "#F59E0B" },
                { icon: "👤", label: "Update Profile", to: "/profile", color: "#06B6D4" },
              ].map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.65rem",
                    padding: "0.6rem 0.75rem", borderRadius: 8,
                    fontSize: "0.85rem", fontWeight: 600,
                    color: "var(--color-text-primary)",
                    transition: "background 0.15s ease",
                    textDecoration: "none",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--color-bg)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <span style={{
                    width: 28, height: 28, borderRadius: 6,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.9rem", background: `${l.color}15`,
                  }}>
                    {l.icon}
                  </span>
                  {l.label}
                  <span style={{ marginLeft: "auto", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StudentDashboard;
