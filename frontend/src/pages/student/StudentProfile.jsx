import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";

export const StudentProfile = () => {
  const { user, refreshUser } = useAuth();
  const student = user?.profile;

  // Form states
  const [fullName, setFullName] = useState(student?.full_name || "");
  const [phone, setPhone] = useState(student?.phone || "");
  const [branch, setBranch] = useState(student?.branch || "CSE");
  const [gradYear, setGradYear] = useState(student?.graduation_year || 2026);
  const [cgpa, setCgpa] = useState(student?.cgpa || "");
  const [backlogs, setBacklogs] = useState(student?.active_backlogs || 0);
  const [skills, setSkills] = useState(student?.skills ? student.skills.join(", ") : "");

  // File upload states
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Status alerts
  const [profileMsg, setProfileMsg] = useState("");
  const [profileError, setProfileError] = useState("");
  const [resumeMsg, setResumeMsg] = useState("");
  const [resumeError, setResumeError] = useState("");

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileMsg("");
    setProfileError("");

    const skillsArray = skills
      ? skills.split(",").map((s) => s.trim()).filter((s) => s.length > 0)
      : [];

    const payload = {
      full_name: fullName,
      phone,
      branch,
      graduation_year: parseInt(gradYear),
      cgpa: parseFloat(cgpa),
      active_backlogs: parseInt(backlogs),
      skills: skillsArray,
    };

    try {
      await apiFetch("/api/students/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setProfileMsg("Profile updated successfully!");
      await refreshUser(); // sync context state
    } catch (err) {
      console.error(err);
      setProfileError(err.message || "Failed to update profile.");
    }
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    setResumeMsg("");
    setResumeError("");

    if (!file) {
      setResumeError("Please select a PDF file first.");
      return;
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setResumeError("Only PDF files are supported.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setResumeError("File size exceeds 5MB limit.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      await apiFetch("/api/students/me/resume", {
        method: "POST",
        body: formData,
      });
      setResumeMsg("Resume uploaded and verified successfully!");
      setFile(null);
      await refreshUser();
    } catch (err) {
      console.error(err);
      setResumeError(err.message || "Resume upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-navy-dark)", marginBottom: "0.25rem" }}>
          My Profile & Resume
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          Ensure your academic credentials and contact info are accurate.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "2rem" }} className="form-row">
        {/* Profile Card */}
        <div className="card">
          <h3 className="card-title">Academic & Contact Information</h3>
          
          {profileMsg && <div className="alert alert-success">{profileMsg}</div>}
          {profileError && <div className="alert alert-danger">{profileError}</div>}

          <form onSubmit={handleSaveProfile}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Academic Branch</label>
                <select
                  className="form-control"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                >
                  <option value="CSE">Computer Science (CSE)</option>
                  <option value="ECE">Electronics (ECE)</option>
                  <option value="ME">Mechanical (ME)</option>
                  <option value="EE">Electrical (EE)</option>
                  <option value="CE">Civil (CE)</option>
                  <option value="IT">Information Technology (IT)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Graduation Year</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Current CGPA (0 - 10)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  className="form-control"
                  required
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Active Backlogs</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  required
                  value={backlogs}
                  onChange={(e) => setBacklogs(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "1.75rem" }}>
              <label className="form-label">Professional Skills (Comma separated)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Python, React, AWS, SQL"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Save Academic Profile
            </button>
          </form>
        </div>

        {/* Resume Card */}
        <div className="card" style={{ height: "fit-content" }}>
          <h3 className="card-title">Resume Manager</h3>
          
          {resumeMsg && <div className="alert alert-success">{resumeMsg}</div>}
          {resumeError && <div className="alert alert-danger">{resumeError}</div>}

          <div style={{ marginBottom: "1.5rem" }}>
            {student?.resume_path ? (
              <div style={{ backgroundColor: "var(--color-primary-light)", padding: "1rem", borderRadius: "6px", border: "1px solid rgba(37,99,235,0.15)", marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", display: "block" }}>
                  Active Resume
                </span>
                <a
                  href={student.resume_path}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", color: "var(--color-primary)", fontWeight: 600, fontSize: "0.9rem", textDecoration: "none", marginTop: "0.25rem" }}
                >
                  View Current Resume (PDF)
                </a>
              </div>
            ) : (
              <div className="alert alert-warning" style={{ fontSize: "0.8rem", margin: "0 0 1.5rem 0" }}>
                No resume uploaded yet. You cannot apply to jobs without uploading a verified PDF.
              </div>
            )}

            <form onSubmit={handleResumeUpload}>
              <div className="form-group">
                <label className="form-label">Upload New Resume</label>
                <input
                  type="file"
                  className="form-control"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "0.25rem", display: "block" }}>
                  Supported Format: PDF only (Max 5MB)
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={uploading}
              >
                {uploading ? "Verifying & Uploading..." : "Upload Resume"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StudentProfile;
