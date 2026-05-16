"use client";

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('auth-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Support both Zustand persist structure { state: { token: ... } }
      // and flat structure { token: ... }
      const token = parsed?.state?.token || parsed?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        console.warn('[API Client] Auth storage found but no token present');
      }
    } else {
      console.warn('[API Client] No auth-storage found in localStorage');
    }
  } catch (e) {
    console.error('[API Client] Error parsing auth storage', e);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isAuthRoute = requestUrl.startsWith('/auth/');

    // Only redirect to login for 401s on protected routes, NOT on auth routes
    // (otherwise login failures cause an infinite redirect loop)
    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('auth-storage');
      if (window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/saved')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
