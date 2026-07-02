import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../utils/api";

export const PostDrive = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const company = user?.profile;

  // Form states
  const [roleTitle, setRoleTitle] = useState("");
  const [description, setDescription] = useState("");
  const [packageLpa, setPackageLpa] = useState("");
  const [minCgpa, setMinCgpa] = useState("");
  const [maxBacklogs, setMaxBacklogs] = useState("0");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Checkbox arrays
  const branchList = ["CSE", "ECE", "ME", "EE", "CE", "IT"];
  const [selectedBranches, setSelectedBranches] = useState([]);

  const gradYearsList = [2025, 2026, 2027];
  const [selectedGradYears, setSelectedGradYears] = useState([]);

  const handleBranchChange = (branch) => {
    if (selectedBranches.includes(branch)) {
      setSelectedBranches(selectedBranches.filter((b) => b !== branch));
    } else {
      setSelectedBranches([...selectedBranches, branch]);
    }
  };

  const handleGradYearChange = (year) => {
    if (selectedGradYears.includes(year)) {
      setSelectedGradYears(selectedGradYears.filter((y) => y !== year));
    } else {
      setSelectedGradYears([...selectedGradYears, year]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (company?.status !== "approved") {
      setError("Only approved companies can post job drives.");
      return;
    }

    if (selectedBranches.length === 0) {
      setError("Please select at least one eligible academic branch.");
      return;
    }

    if (selectedGradYears.length === 0) {
      setError("Please select at least one eligible graduation year.");
      return;
    }

    setLoading(true);

    const payload = {
      role_title: roleTitle,
      description,
      package_lpa: parseFloat(packageLpa),
      min_cgpa: parseFloat(minCgpa),
      max_backlogs: parseInt(maxBacklogs),
      eligible_branches: selectedBranches,
      eligible_grad_years: selectedGradYears.map(y => parseInt(y)),
      application_deadline: new Date(deadline).toISOString(),
      is_active: true,
    };

    try {
      await apiFetch("/api/drives", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      navigate("/manage-drives?created=true");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create recruitment drive.");
    } finally {
      setLoading(false);
    }
  };

  // Redirect if company is not approved
  if (company?.status !== "approved") {
    return (
      <div className="alert alert-danger" style={{ borderLeft: "4px solid var(--color-danger)" }}>
        <strong>Access Denied:</strong> Your recruiter account is pending approval by the admin. 
        You are not authorized to create placement drives until approved.
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-navy-dark)", marginBottom: "0.25rem" }}>
          Post Job Recruitment Drive
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          Publish a new job role. Students meeting the eligibility cutoffs will be able to apply.
        </p>
      </div>

      <div className="card">
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Job Title / Designation</label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="e.g. Associate Software Engineer"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Job Description & Description of Requirements</label>
            <textarea
              className="form-control"
              required
              rows="5"
              placeholder="Provide job details, responsibilities, location, skills, and screening procedure..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Annual CTC Offer (LPA)</label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                className="form-control"
                required
                placeholder="e.g. 12.5"
                value={packageLpa}
                onChange={(e) => setPackageLpa(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Application Deadline</label>
              <input
                type="datetime-local"
                className="form-control"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Minimum CGPA Requirement (0 - 10)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                className="form-control"
                required
                placeholder="e.g. 7.5"
                value={minCgpa}
                onChange={(e) => setMinCgpa(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Maximum Active Backlogs Allowed</label>
              <input
                type="number"
                min="0"
                className="form-control"
                required
                value={maxBacklogs}
                onChange={(e) => setMaxBacklogs(e.target.value)}
              />
            </div>
          </div>

          {/* Branches list */}
          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label className="form-label">Eligible Branches</label>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              {branchList.map((b) => (
                <label key={b} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.9rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedBranches.includes(b)}
                    onChange={() => handleBranchChange(b)}
                    style={{ width: "16px", height: "16px" }}
                  />
                  {b}
                </label>
              ))}
            </div>
          </div>

          {/* Grad years list */}
          <div className="form-group" style={{ marginBottom: "2rem" }}>
            <label className="form-label">Target Graduation Years</label>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
              {gradYearsList.map((y) => (
                <label key={y} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", fontSize: "0.9rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selectedGradYears.includes(y)}
                    onChange={() => handleGradYearChange(y)}
                    style={{ width: "16px", height: "16px" }}
                  />
                  Class of {y}
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: "0.75rem 1.5rem" }}
            disabled={loading}
          >
            {loading ? "Publishing Recruitment Drive..." : "Publish Job Drive"}
          </button>
        </form>
      </div>
    </div>
  );
};
export default PostDrive;
