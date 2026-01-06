import axios from 'axios';

// Use relative paths for Next.js API routes (serverless)
const API_BASE_URL = typeof window !== 'undefined' ? '' : process.env.NEXT_PUBLIC_API_BASE_URL || '';

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
    // Add cache buster for orders endpoint
    if (config.url?.includes('/api/orders/my')) {
      const separator = config.url.includes('?') ? '&' : '?';
      config.url = `${config.url}${separator}_t=${Date.now()}`;
    }

    if (typeof window !== 'undefined') {
      // Check both localStorage and cookie
      const localStorageToken = localStorage.getItem('token');
      const cookieMatch = document.cookie.match(/(?:^|;\s*)token=([^;]+)/);
      const cookieToken = cookieMatch ? cookieMatch[1] : null;
      
      // Only log in development mode to avoid console spam
      // Check both NODE_ENV and origin to ensure we're not in production
      const isDevelopment = process.env.NODE_ENV === 'development' || 
                           (typeof window !== 'undefined' && window.location.hostname === 'localhost');
      
      if (isDevelopment) {
        console.log(`🌐 [API Request] ${config.method?.toUpperCase()} ${config.url}`, {
          baseURL: config.baseURL,
          origin: window.location.origin,
          hasLocalStorageToken: !!localStorageToken,
          hasCookieToken: !!cookieToken,
          tokensMatch: localStorageToken === cookieToken,
          tokenLength: localStorageToken?.length || 0,
        });
      }
      
      // Add token from localStorage if available
      if (localStorageToken && config.headers) {
        config.headers.Authorization = `Bearer ${localStorageToken}`;
        // Only log in development
        if (isDevelopment) {
          console.log('✅ Added Authorization header to request');
        }
      } else {
        // Only log in development
        if (isDevelopment) {
          console.log('⚠️ No token found - request will be unauthenticated');
        }
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
    // Only log in development mode to avoid console spam
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
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

