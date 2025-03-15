import axios from "axios";
import { toast } from "react-toastify";

// Create axios instance
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 responses (unauthorized - token expired)
    if (error.response && error.response.status === 401) {
      // Clear user data from local storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Show a notification to the user
      if (toast) {
        toast.error("Your session has expired. Please log in again.");
      } else {
        alert("Your session has expired. Please log in again.");
      }

      // Redirect to login page
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// Utility function to check if token is expired
export const isTokenExpired = () => {
  const token = localStorage.getItem("token");
  if (!token) return true;

  try {
    // If using JWT, decode it to check expiration
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    const { exp } = JSON.parse(jsonPayload);
    return Date.now() >= exp * 1000;
  } catch (e) {
    console.error("Error checking token expiration:", e);
    return true; // If we can't decode the token, consider it expired
  }
};

// Export default instance
export default api;
