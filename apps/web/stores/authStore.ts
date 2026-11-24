import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SafeUser, UserProfile } from '@studyflow/shared';
import { apiRequest } from '../lib/api';

interface AuthState {
  user: SafeUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  setUser: (user: SafeUser | null, profile?: UserProfile | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

// SSR-Safe storage wrapper for Next.js
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore quota or private browsing errors
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
};

let checkAuthPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: true,
      isInitialized: false,
      isAuthenticated: false,

      setUser: (user, profile = null) =>
        set({
          user,
          profile,
          isAuthenticated: !!user,
          isLoading: false,
          isInitialized: true,
        }),

      checkAuth: async () => {
        if (checkAuthPromise) {
          return checkAuthPromise;
        }

        // Only indicate loading state if we do not already have a user in memory or storage
        if (!get().user) {
          set({ isLoading: true });
        }

        checkAuthPromise = (async () => {
          try {
            const data = await apiRequest<{ user: SafeUser; profile: UserProfile | null }>('/auth/me');
            set({
              user: data.user,
              profile: data.profile,
              isAuthenticated: true,
              isLoading: false,
              isInitialized: true,
            });
          } catch {
            // If server rejects cookie session, clear client state
            set({
              user: null,
              profile: null,
              isAuthenticated: false,
              isLoading: false,
              isInitialized: true,
            });
          } finally {
            checkAuthPromise = null;
          }
        })();

        return checkAuthPromise;
      },

      logout: async () => {
        try {
          await apiRequest('/auth/logout', { method: 'POST' });
        } catch {
          // Handled silently
        } finally {
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
            isInitialized: true,
          });
          window.location.href = '/login';
        }
      },
    }),
    {
      name: 'studyflow-auth-storage',
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
      merge: (persistedState: any, currentState: AuthState) => {
        const merged = { ...currentState, ...(persistedState || {}) };
        if (merged.user) {
          merged.isLoading = false;
          merged.isInitialized = true;
          merged.isAuthenticated = true;
        }
        return merged;
      },
    }
  )
);
