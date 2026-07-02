import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Guard for routes that require the user to be logged in.
 * Optionally checks if user role matches one of allowedRoles.
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", fontStyle: "italic", color: "var(--color-text-secondary)" }}>
        Loading student portal...
      </div>
    );
  }

  if (!user) {
    // Redirect to login page but save the current location they tried to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Role unauthorized: redirect to their default home page
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * Guard for public/auth pages (like login/register) to redirect already logged-in users.
 */
export const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (user) {
    // Already logged in, redirect to their home
    return <Navigate to="/" replace />;
  }

  return children;
};
