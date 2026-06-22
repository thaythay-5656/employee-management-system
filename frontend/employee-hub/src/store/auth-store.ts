import { create } from 'zustand';
import { login as apiLogin, logout as apiLogout } from '@/api/auth';
import { tokenStorage, type StoredUser } from '@/api/tokenStorage';
import { ApiRequestError, AUTH_EXPIRED_EVENT } from '@/api/client';

interface AuthState {
  user: StoredUser | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  /** Called on mount and on cross-tab storage events to sync state from localStorage. */
  syncFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: tokenStorage.getUser(),
  isAuthenticated: !!tokenStorage.getAccess(),
  isInitialized: false,

  login: async (username, password) => {
    try {
      const data = await apiLogin({ username, password });
      set({ user: data.user, isAuthenticated: true });
      return { ok: true };
    } catch (err) {
      if (err instanceof ApiRequestError) {
        return { ok: false, error: err.data.error ?? err.data.detail ?? 'Login failed' };
      }
      return { ok: false, error: 'Login failed' };
    }
  },

  logout: async () => {
    await apiLogout();
    set({ user: null, isAuthenticated: false });
  },

  syncFromStorage: () => {
    const access = tokenStorage.getAccess();
    const user = tokenStorage.getUser();
    const current = get();

    const nowAuthenticated = !!access && !!user;

    // Avoid redundant re-renders if nothing actually changed
    if (current.isAuthenticated !== nowAuthenticated || current.user?.id !== user?.id) {
      set({ user: nowAuthenticated ? user : null, isAuthenticated: nowAuthenticated });
    }

    if (!current.isInitialized) {
      set({ isInitialized: true });
    }
  },
}));

/**
 * Cross-tab sync: localStorage writes in one tab fire a 'storage' event in
 * OTHER tabs (not the originating tab). When tokens are cleared (logout) or
 * set (login) in tab A, tab B picks it up here and updates its store —
 * route guards then redirect accordingly.
 */
if (typeof window !== 'undefined') {
  // Other tabs: localStorage changes (login/logout elsewhere)
  window.addEventListener('storage', (event) => {
    if (event.key === 'access_token' || event.key === 'auth_user' || event.key === 'refresh_token' || event.key === null) {
      useAuthStore.getState().syncFromStorage();
    }
  });

  // Same tab: refresh token expired during an API call
  window.addEventListener(AUTH_EXPIRED_EVENT, () => {
    useAuthStore.getState().syncFromStorage();
  });
}