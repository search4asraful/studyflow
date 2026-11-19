import { create } from 'zustand';
import { SafeUser, UserProfile } from '@studyflow/shared';
import { apiRequest } from '../lib/api';

interface AuthState {
  user: SafeUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: SafeUser | null, profile?: UserProfile | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user, profile = null) =>
    set({
      user,
      profile,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const data = await apiRequest<{ user: SafeUser; profile: UserProfile | null }>('/auth/me');
      set({
        user: data.user,
        profile: data.profile,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      set({
        user: null,
        profile: null,
        isAuthenticated: false,
        isLoading: false,
      });
      window.location.href = '/login';
    }
  },
}));
