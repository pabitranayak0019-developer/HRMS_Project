import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';
const UPLOADS_URL = import.meta.env.VITE_UPLOADS_URL || '';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hrms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    if (status === 401 && err.response?.config?.url !== '/auth/login' && !err.config?.__retried) {
      localStorage.removeItem('hrms_token');
      localStorage.removeItem('hrms_user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const setAuth = (token, user) => {
  if (token) localStorage.setItem('hrms_token', token);
  if (user) localStorage.setItem('hrms_user', JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem('hrms_token');
  localStorage.removeItem('hrms_user');
};

export const getToken = () => localStorage.getItem('hrms_token');
export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('hrms_user'));
  } catch {
    return null;
  }
};

export const getErrorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  return err?.response?.data?.message || err?.message || fallback;
};

export const uploadUrl = (filePath) => {
  if (!filePath) return '';
  if (filePath.startsWith('http')) return filePath;
  return `${UPLOADS_URL}/${filePath}`;
};

export default api;
