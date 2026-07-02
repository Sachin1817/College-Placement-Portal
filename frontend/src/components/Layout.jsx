import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Role-specific nav config with icons and section grouping
const NAV_CONFIG = {
  guest: [
    { section: "Explore", links: [
      { to: "/stats",  icon: "📊", label: "Placement Statistics" },
      { to: "/login",  icon: "🔑", label: "Sign In" },
    ]},
  ],
  student: [
    { section: "Overview", links: [
      { to: "/",            icon: "🏠", label: "Dashboard" },
    ]},
    { section: "Recruitment", links: [
      { to: "/drives",      icon: "💼", label: "Browse Drives" },
      { to: "/applications",icon: "📋", label: "My Applications" },
      { to: "/interviews",  icon: "📅", label: "Interview Schedule" },
    ]},
    { section: "Account", links: [
      { to: "/profile",     icon: "👤", label: "Profile & Resume" },
      { to: "/stats",       icon: "📊", label: "Placement Stats" },
    ]},
  ],
  company: [
    { section: "Overview", links: [
      { to: "/",            icon: "🏠", label: "Dashboard" },
    ]},
    { section: "Recruitment", links: [
      { to: "/post-drive",  icon: "➕", label: "Post Job Drive" },
      { to: "/manage-drives", icon: "🗂", label: "Manage Drives" },
    ]},
    { section: "Insights", links: [
      { to: "/stats",       icon: "📊", label: "Placement Stats" },
    ]},
  ],
  admin: [
    { section: "Overview", links: [
      { to: "/",                 icon: "🏠", label: "Dashboard" },
    ]},
    { section: "Administration", links: [
      { to: "/verify-students",  icon: "✅", label: "Verify Students" },
      { to: "/approve-companies", icon: "🏢", label: "Approve Companies" },
    ]},
    { section: "Insights", links: [
      { to: "/stats",            icon: "📊", label: "Placement Stats" },
    ]},
  ],
};

const getInitials = (email = "") =>
  email.split("@")[0].slice(0, 2).toUpperCase();

const getRoleLabel = (role) => {
  const labels = { student: "Student", company: "Recruiter", admin: "TPO Admin" };
  return labels[role] || role;
};

export const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sections = NAV_CONFIG[user?.role || "guest"];

  return (
    <div className="app-container">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        {/* Logo / Brand */}
        <div className="sidebar-header">
          <div className="sidebar-title">
            <div className="sidebar-title-icon">🎓</div>
            <span>TPO Portal</span>
          </div>
          <div className="sidebar-subtitle">Training &amp; Placement Office</div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: "auto" }}>
          <ul className="sidebar-menu">
            {sections.map((section) => (
              <React.Fragment key={section.section}>
                <div className="sidebar-section-label">{section.section}</div>
                {section.links.map((link) => (
                  <li key={link.to} className="sidebar-menu-item">
                    <NavLink
                      to={link.to}
                      end={link.to === "/"}
                      className={({ isActive }) =>
                        `sidebar-link${isActive ? " active" : ""}`
                      }
                    >
                      <span className="sidebar-link-icon">{link.icon}</span>
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </React.Fragment>
            ))}
          </ul>
        </nav>

        {/* Footer — user pill + sign out */}
        <div className="sidebar-footer">
          {user ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <div className="sidebar-user-pill">
                <div className="sidebar-avatar">{getInitials(user.email)}</div>
                <div className="sidebar-user-info">
                  <div className="sidebar-user-email">{user.email}</div>
                  <div className="sidebar-user-role">{getRoleLabel(user.role)}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: "100%", padding: "0.5rem",
                  background: "rgba(239,68,68,0.1)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: "var(--radius-sm)",
                  color: "#FCA5A5",
                  fontSize: "0.8rem", fontWeight: 600,
                  cursor: "pointer", transition: "all var(--transition)",
                }}
                onMouseEnter={e => { e.target.style.background = "rgba(239,68,68,0.2)"; }}
                onMouseLeave={e => { e.target.style.background = "rgba(239,68,68,0.1)"; }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              Sign In
            </Link>
          )}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="main-content">
        <header className="topbar">
          <h1 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
            {user
              ? `${getRoleLabel(user.role)} Workspace`
              : "Campus Placement Portal"}
          </h1>
          {user && (
            <div className="topbar-user">
              <span className="topbar-user-email">{user.email}</span>
              <span className="topbar-user-role">{getRoleLabel(user.role)}</span>
              {user.role === "student" && user.profile?.placed && (
                <span className="badge badge-success">🏆 Placed</span>
              )}
            </div>
          )}
        </header>

        <main className="page-container">{children}</main>
      </div>
    </div>
  );
};
