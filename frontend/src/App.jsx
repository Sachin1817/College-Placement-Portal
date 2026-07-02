import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "./components/RouteGuards";
import { Layout } from "./components/Layout";

// Import pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import PlacementStats from "./pages/PlacementStats";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard";
import BrowseDrives from "./pages/student/BrowseDrives";
import MyApplications from "./pages/student/MyApplications";
import InterviewSchedule from "./pages/student/InterviewSchedule";
import StudentProfile from "./pages/student/StudentProfile";

// Company pages
import CompanyDashboard from "./pages/company/CompanyDashboard";
import PostDrive from "./pages/company/PostDrive";
import ManageDrives from "./pages/company/ManageDrives";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import VerifyStudents from "./pages/admin/VerifyStudents";
import ApproveCompanies from "./pages/admin/ApproveCompanies";

// Home router component: determines which dashboard to display based on the authenticated user's role
const HomeRouteSelector = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case "student":
      return <StudentDashboard />;
    case "company":
      return <CompanyDashboard />;
    case "admin":
      return <AdminDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />

          {/* Public Statistics Route (Wraps inside layout showing sign-in/sign-out sidebar actions) */}
          <Route
            path="/stats"
            element={
              <Layout>
                <PlacementStats />
              </Layout>
            }
          />

          {/* Home / Root Dashboard (Resolves based on current user role) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <HomeRouteSelector />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Student Role Routes */}
          <Route
            path="/drives"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <Layout>
                  <BrowseDrives />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <Layout>
                  <MyApplications />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/interviews"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <Layout>
                  <InterviewSchedule />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <Layout>
                  <StudentProfile />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Company Role Routes */}
          <Route
            path="/post-drive"
            element={
              <ProtectedRoute allowedRoles={["company"]}>
                <Layout>
                  <PostDrive />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-drives"
            element={
              <ProtectedRoute allowedRoles={["company"]}>
                <Layout>
                  <ManageDrives />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin Role Routes */}
          <Route
            path="/verify-students"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout>
                  <VerifyStudents />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/approve-companies"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout>
                  <ApproveCompanies />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
