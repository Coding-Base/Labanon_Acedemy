import axios, { AxiosInstance } from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

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

  // Response Interceptor: Handle 401
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.warn('[Axios] 401 Unauthorized - Token might be expired.');
        // Optional: Clear storage or redirect, but be careful of loops
        // localStorage.removeItem('access'); 
        // window.location.href = '/login'; 
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
  console.log('Global Axios Interceptors initialized');
};

// 3. Default export for new components
export default api;