import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

export const Register = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("student"); // "student" or "company"
  
  // Common states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Student profile states
  const [fullName, setFullName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [branch, setBranch] = useState("CSE");
  const [gradYear, setGradYear] = useState(new Date().getFullYear());
  const [cgpa, setCgpa] = useState("");
  const [backlogs, setBacklogs] = useState("0");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState("");

  // Company profile states
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [hrName, setHrName] = useState("");
  const [hrPhone, setHrPhone] = useState("");

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const skillsArray = skills
      ? skills.split(",").map((s) => s.trim()).filter((s) => s.length > 0)
      : [];

    const payload = {
      email,
      password,
      full_name: fullName,
      roll_number: rollNumber,
      branch,
      graduation_year: parseInt(gradYear),
      cgpa: parseFloat(cgpa),
      active_backlogs: parseInt(backlogs),
      phone,
      skills: skillsArray,
    };

    try {
      await apiFetch("/api/auth/register/student", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      // Redirect to login
      navigate("/login?registered=student");
    } catch (err) {
      setError(err.message || "Student registration failed. Please check details.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const payload = {
      email,
      password,
      company_name: companyName,
      website,
      hr_contact_name: hrName,
      hr_contact_phone: hrPhone,
    };

    try {
      await apiFetch("/api/auth/register/company", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      // Redirect to login
      navigate("/login?registered=company");
    } catch (err) {
      setError(err.message || "Company registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ minHeight: "120vh" }}>
      <div className="auth-card" style={{ maxWidth: "600px" }}>
        <div className="auth-header">
          <h2>Create Account</h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
            Campus Placement Office (TPO) Registration
          </p>
        </div>

        {/* Tab Selection */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${activeTab === "student" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("student");
              setError("");
            }}
          >
            I am a Student
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === "company" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("company");
              setError("");
            }}
          >
            I am a Recruiter / Company
          </button>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {activeTab === "student" ? (
          // Student Form
          <form onSubmit={handleStudentSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Roll Number</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. 2026CSE102"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Branch</label>
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
                <label className="form-label">CGPA (0 - 10)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  className="form-control"
                  required
                  placeholder="e.g. 8.75"
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

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Contact Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  required
                  placeholder="10 digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Skills (Comma separated)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="React, Node.js, Python, SQL"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Institutional Email</label>
                <input
                  type="email"
                  className="form-control"
                  required
                  placeholder="rahul.cse26@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem", justifyContent: "center", marginTop: "1rem" }}
              disabled={loading}
            >
              {loading ? "Creating Profile..." : "Register as Student"}
            </button>
          </form>
        ) : (
          // Company Form
          <form onSubmit={handleCompanySubmit}>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                className="form-control"
                required
                placeholder="e.g. Google India"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Website URL</label>
              <input
                type="url"
                className="form-control"
                required
                placeholder="e.g. https://google.com"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">HR Contact Name</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Alice Smith"
                  value={hrName}
                  onChange={(e) => setHrName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">HR Contact Phone</label>
                <input
                  type="tel"
                  className="form-control"
                  required
                  placeholder="HR direct phone number"
                  value={hrPhone}
                  onChange={(e) => setHrPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Corporate Email</label>
                <input
                  type="email"
                  className="form-control"
                  required
                  placeholder="hr@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-control"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%", padding: "0.75rem", fontSize: "0.95rem", justifyContent: "center", marginTop: "1rem" }}
              disabled={loading}
            >
              {loading ? "Registering HR Profile..." : "Register Company"}
            </button>
          </form>
        )}

        <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
export default Register;
