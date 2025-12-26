import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'

/**
 * Setup global axios interceptors for JWT token handling
 * - Auto-logout on 401 Unauthorized responses (token expired/invalid)
 * - Redirect to login page automatically
 */
export function setupAxiosInterceptors() {
  // Response interceptor to handle 401 (token expired/invalid)
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token is invalid or expired
        handleTokenExpiry();
        return Promise.reject(error);
      }
      return Promise.reject(error);
    }
  );
}

/**
 * Handle token expiry: clear auth data and redirect to login
 */
export function handleTokenExpiry() {
  // Only redirect once to avoid infinite loop
  if (window.location.pathname === '/login') {
    return;
  }

  // Clear auth data from localStorage
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  localStorage.removeItem('role');
  localStorage.removeItem('user_id');
  
  // Show alert to user
  alert('Your session has expired. Please log in again.');
  
  // Redirect to login page with referrer
  const currentPath = window.location.pathname;
  window.location.href = `/login?next=${encodeURIComponent(currentPath)}&expired=true`;
}

