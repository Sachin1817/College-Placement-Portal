import React, { useEffect, useState } from "react";
import { apiFetch } from "../../utils/api";

export const VerifyStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  async function loadUnverified() {
    try {
      const data = await apiFetch("/api/admin/students/unverified");
      setStudents(data);
    } catch (err) {
      console.error(err);
      setError("Failed to retrieve unverified students list.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUnverified();
  }, []);

  const handleVerify = async (id, name) => {
    setError("");
    setSuccessMsg("");
    try {
      await apiFetch(`/api/admin/students/${id}/verify`, {
        method: "PATCH",
      });
      setSuccessMsg(`Successfully verified student account for ${name}!`);
      loadUnverified();
    } catch (err) {
      setError(err.message || "Failed to verify student.");
    }
  };

  if (loading) {
    return <div style={{ color: "var(--color-text-secondary)" }}>Loading student verification queue...</div>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-navy-dark)", marginBottom: "0.25rem" }}>
          Student Verification Queue
        </h2>
        <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>
          Confirm student identity and academic credentials match university records before verifying.
        </p>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {students.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--color-text-secondary)" }}>
          <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>No student accounts are pending verification.</p>
          <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
            All registered students have been approved and verified.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="dense-table">
            <thead>
              <tr>
                <th>Roll Number</th>
                <th>Full Name</th>
                <th>Branch</th>
                <th style={{ textAlign: "right" }}>CGPA</th>
                <th style={{ textAlign: "right" }}>Backlogs</th>
                <th>Contact Phone</th>
                <th>Email Address</th>
                <th>Resume</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="mono" style={{ fontWeight: 600 }}>{student.roll_number}</td>
                  <td style={{ fontWeight: 500 }}>{student.full_name}</td>
                  <td>{student.branch}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{student.cgpa.toFixed(2)}</td>
                  <td className="mono" style={{ textAlign: "right" }}>{student.active_backlogs}</td>
                  <td className="mono">{student.phone}</td>
                  <td>{student.user?.email}</td>
                  <td>
                    {student.resume_path ? (
                      <a
                        href={student.resume_path}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 500 }}
                      >
                        PDF Resume
                      </a>
                    ) : (
                      <span style={{ color: "var(--color-danger)", fontStyle: "italic", fontSize: "0.8rem" }}>
                        Not uploaded
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => handleVerify(student.id, student.full_name)}
                      className="btn btn-success"
                      style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
                    >
                      Verify Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default VerifyStudents;
