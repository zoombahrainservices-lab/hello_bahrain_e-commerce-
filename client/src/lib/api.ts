import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging and auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        baseURL: config.baseURL,
        origin: window.location.origin,
      });
      
      // Add token from localStorage if available
      const token = localStorage.getItem('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (typeof window !== 'undefined') {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
    }
    return response;
  },
  (error) => {
    if (typeof window !== 'undefined') {
      console.error('[API Error]', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        response: error.response?.data,
        cors: error.code === 'ERR_NETWORK' || error.message?.includes('CORS'),
      });
    }
    
    if (error.response?.status === 401) {
      // Handle unauthorized - could redirect to login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
        // Only redirect if not already on auth page
        // window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

