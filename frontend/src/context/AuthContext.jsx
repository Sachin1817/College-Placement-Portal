import React, { createContext, useState, useEffect, useContext } from "react";
import { apiFetch, parseJwt } from "../utils/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage token on mount
  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("tpo_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const decoded = parseJwt(token);
      if (!decoded || decoded.exp * 1000 < Date.now()) {
        // Token is invalid or expired
        localStorage.removeItem("tpo_token");
        setLoading(false);
        return;
      }

      try {
        await fetchUserProfile(decoded.role, decoded.sub, decoded.user_id);
      } catch (err) {
        console.error("Failed to load user profile", err);
        localStorage.removeItem("tpo_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // Fetch the detailed profile of the user based on role
  async function fetchUserProfile(role, email, userId) {
    let profile = null;
    if (role === "student") {
      profile = await apiFetch("/api/students/me");
    } else if (role === "company") {
      profile = await apiFetch("/api/auth/me/company");
    }

    setUser({
      id: userId,
      email,
      role,
      profile,
    });
  }

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Login uses standard OAuth2 Form URL-Encoded inputs
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const data = await apiFetch("/api/auth/login", {
        method: "POST",
        body: formData,
      });

      localStorage.setItem("tpo_token", data.access_token);
      
      const decoded = parseJwt(data.access_token);
      localStorage.setItem("tpo_role", decoded.role);
      
      await fetchUserProfile(decoded.role, decoded.sub, decoded.user_id);
      return decoded.role;
    } catch (err) {
      setUser(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("tpo_token");
    localStorage.removeItem("tpo_role");
    setUser(null);
  };

  const refreshUser = async () => {
    if (!user) return;
    try {
      await fetchUserProfile(user.role, user.email, user.id);
    } catch (err) {
      console.error("Failed to refresh user profile", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
