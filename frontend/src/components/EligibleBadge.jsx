import React from "react";

/**
 * Signature component displaying eligibility status.
 * Hovering or clicking reveals a detailed tooltip listing unmet requirements.
 */
export const EligibleBadge = ({ eligible, reasons = [] }) => {
  return (
    <div className="eligibility-badge-container">
      {eligible ? (
        <span className="eligibility-badge eligible">
          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-success)" }}></span>
          Eligible
        </span>
      ) : (
        <span className="eligibility-badge ineligible">
          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--color-danger)" }}></span>
          Not Eligible
        </span>
      )}

      {!eligible && reasons.length > 0 && (
        <div className="eligibility-tooltip">
          <strong style={{ display: "block", marginBottom: "0.25rem" }}>Ineligibility Reasons:</strong>
          <ul className="eligibility-reasons-list">
            {reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
