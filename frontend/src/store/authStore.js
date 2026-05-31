import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      isAuthReady: false,

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          set({ user: data, token: data.token, isAuthenticated: true, loading: false, isAuthReady: true });
          return data;
        } catch (err) {
          const message = err.response?.data?.message || 'Login failed';
          set({ error: message, loading: false });
          throw new Error(message);
        }
      },

      register: async (formData) => {
        set({ loading: true, error: null });
        try {
          const { data } = await api.post('/auth/register', formData);
          set({ user: data, token: data.token, isAuthenticated: true, loading: false, isAuthReady: true });
          return data;
        } catch (err) {
          const message = err.response?.data?.message || 'Registration failed';
          set({ error: message, loading: false });
          throw new Error(message);
        }
      },

      logout: () => {
        localStorage.removeItem('spt-auth');
        set({ user: null, token: null, isAuthenticated: false, loading: false, error: null, isAuthReady: true });
      },

      initializeAuth: async () => {
        const { token } = get();
        if (!token) {
          set({ isAuthReady: true });
          return;
        }

        set({ loading: true, error: null });
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data, isAuthenticated: true, loading: false, isAuthReady: true });
        } catch {
          get().logout();
        }
      },

      fetchMe: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data, isAuthenticated: true });
        } catch {
          get().logout();
        }
      },

      updateUser: (updates) => {
        set({ user: { ...get().user, ...updates } });
      },
    }),
    {
      name: 'spt-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.set({ isAuthReady: false, loading: false, error: null });
        return () => {
          state.initializeAuth();
        };
      },
    }
  )
);

export default useAuthStore;
