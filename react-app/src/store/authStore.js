import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (emailOrId, password) => {
        const { data } = await api.post('/auth/login', { emailOrId, password });
        set({ user: data.user, token: data.token, isAuthenticated: true });
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        return data.user;
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        delete api.defaults.headers.common['Authorization'];
      },

      refreshToken: async () => {
        try {
          const { data } = await api.post('/auth/refresh');
          set({ token: data.token });
          api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        } catch {
          get().logout();
        }
      },

      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),

      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'admin') return true;
        return user.permissions?.includes(permission) ?? false;
      },
    }),
    { name: 'eventops-auth', partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }) }
  )
);
