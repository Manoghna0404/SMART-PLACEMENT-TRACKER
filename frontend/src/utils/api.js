import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ,
});

api.interceptors.request.use((config) => {
  const state = useAuthStore.getState();
  const token = state.token || (() => {
    const stored = localStorage.getItem('spt-auth');
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      return parsed?.state?.token || parsed?.token;
    } catch {
      return null;
    }
  })();

  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const authState = useAuthStore.getState();
      authState.logout?.();
      localStorage.removeItem('spt-auth');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getResumeUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_API_BASE_URL ).replace('/api', '');
  return `${base}${path}`;
};

export default api;
