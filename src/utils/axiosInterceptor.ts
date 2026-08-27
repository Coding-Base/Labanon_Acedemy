import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

// --- Token refresh queue to prevent concurrent refresh races ---
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  failedQueue = [];
};

// --- Helper to attach interceptors to any instance ---
const attachInterceptors = (instance: AxiosInstance) => {
  // Request Interceptor: Auto-inject token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('access');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor: Attempt token refresh on 401 before logging out
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Only handle 401 errors that haven't already been retried
      if (error.response?.status === 401 && !originalRequest._retry) {
        // If we're already refreshing, queue this request to retry after refresh completes
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(instance(originalRequest));
              },
              reject,
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem('refresh');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          // Use a fresh axios instance (not the intercepted one) to avoid infinite loops
          const { data } = await axios.post(
            `${API_BASE}/auth/jwt/refresh/`,
            { refresh: refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );

          // Store the new tokens
          localStorage.setItem('access', data.access);
          if (data.refresh) {
            localStorage.setItem('refresh', data.refresh);
          }

          // Process all queued requests with the new token
          processQueue(null, data.access);

          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return instance(originalRequest);
        } catch (refreshError) {
          // Refresh failed — clear tokens and redirect to login
          processQueue(refreshError);
          console.warn('[Axios] Token refresh failed. Redirecting to login.');
          try {
            localStorage.removeItem('access');
            localStorage.removeItem('refresh');
          } catch (e) {
            // ignore storage errors
          }
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};

// 1. Create the Secure Instance (For Dashboard/Portfolio)
const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach logic to the secure instance
attachInterceptors(api);

// 2. Export the Setup Function (For App.tsx compatibility)
// This applies the same logic to the global axios object so App.tsx is happy
export const setupAxiosInterceptors = () => {
  axios.defaults.baseURL = API_BASE;
  attachInterceptors(axios);
};

// 3. Default export for new components
export default api;