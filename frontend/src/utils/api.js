/**
 * API utility helper for making authenticated requests to the backend.
 * Automatically injects the JWT token and handles common error scenarios.
 */
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem("tpo_token");
  
  const headers = {
    ...options.headers,
  };

  // If payload is not FormData or URLSearchParams, set Content-Type to application/json
  if (options.body && !(options.body instanceof FormData) && !(options.body instanceof URLSearchParams)) {
    headers["Content-Type"] = "application/json";
  }

  // Inject JWT Token if present
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  const response = await fetch(url, fetchOptions);

  // Auto logout on unauthorized (401)
  if (response.status === 401) {
    localStorage.removeItem("tpo_token");
    localStorage.removeItem("tpo_role");
    // Trigger page reload if we are logged in, sending user to login page
    if (window.location.pathname !== "/login") {
      window.location.href = "/login?expired=true";
    }
  }

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
      // Handle array or object details (such as validation errors)
      if (typeof errorDetail === "object") {
        if (errorDetail.message) {
          errorDetail = errorDetail.message + (errorDetail.reasons ? ": " + errorDetail.reasons.join(", ") : "");
        } else {
          errorDetail = JSON.stringify(errorDetail);
        }
      }
    } catch (e) {
      // Fallback if not JSON
      try {
        errorDetail = await response.text();
      } catch (t_err) {}
    }
    throw new Error(errorDetail || response.statusText);
  }

  // Handle empty responses (like 204 No Content or closed drives)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }
  return null;
}

export function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}
