import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api } from "@/lib/api";

let rehydrateResolve: (() => void) | null = null;
const rehydratePromise = new Promise<void>((resolve) => {
  rehydrateResolve = resolve;
});

export function waitForAuthRehydration() {
  return rehydratePromise;
}

function parseStoredAuth(raw: string | null) {
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    const state = parsed?.state ?? {};

    return {
      user: state.user ?? null,
      accessToken: state.accessToken ?? null,
      refreshToken: state.refreshToken ?? null,
      isAuthenticated: Boolean(state.isAuthenticated),
    };
  } catch {
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    };
  }
}

function syncAuthFromStorage() {
  if (typeof window === "undefined") return;

  const raw = localStorage.getItem("nimbus-auth-storage");
  const parsed = parseStoredAuth(raw);
  const previousAuthState = useAuthStore.getState().isAuthenticated;

  useAuthStore.setState({
    user: parsed.user,
    accessToken: parsed.accessToken,
    refreshToken: parsed.refreshToken,
    isAuthenticated: parsed.isAuthenticated,
    isHydrated: true,
  });

  const currentPath = window.location.pathname;
  const isAuthRoute = currentPath !== "/login" && currentPath !== "/forgot-password";

  if (!parsed.isAuthenticated && previousAuthState && isAuthRoute) {
    window.location.href = "/login";
    return;
  }

  if (parsed.isAuthenticated && !previousAuthState && (currentPath === "/login" || currentPath === "/")) {
    window.location.href = "/dashboard";
    return;
  }
}

let crossTabAuthSyncInitialized = false;

function initCrossTabAuthSync() {
  if (typeof window === "undefined" || crossTabAuthSyncInitialized) return;

  crossTabAuthSyncInitialized = true;

  window.addEventListener("storage", (event) => {
    if (event.key !== "nimbus-auth-storage") return;
    syncAuthFromStorage();
  });
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  login: (identity: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

function isTokenExpired(token: string): boolean {
  if (typeof window === "undefined") return true; // SSR safety
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now() + 30_000;
  } catch {
    return true;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: false, // never persisted — always starts false on page load

      initialize: async () => {
        console.log("INITIALIZE CALLED");

        const { accessToken, refreshToken, isAuthenticated } = get();

        console.log("STORE STATE", {
          accessToken,
          refreshToken,
          isAuthenticated,
        });

        // No refresh token = definitely not logged in
        if (!refreshToken) {
          set({ isHydrated: true, isAuthenticated: false });
          return;
        }

        // Access token still valid — restore session immediately
        if (accessToken && !isTokenExpired(accessToken)) {
          set({ isAuthenticated: true, isHydrated: true });
          return;
        }

        // Access token expired — silently refresh it
        try {
          const res = await api.post("/api/login/refresh/", {
            refresh: refreshToken,
          });
          set({
            accessToken: res.data.access,
            isAuthenticated: true,
            isHydrated: true,
          });
        } catch {
          // Refresh token expired too — clear everything
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isHydrated: true,
          });
        }
      },

      login: async (identity, password) => {
        try {
          const response = await api.post("/api/login/", {
            username: identity,
            password: password,
          });

          if (response.data && response.data.error) {
            return { ok: false, error: response.data.error };
          }

          const { access, refresh, user } = response.data;

          if (!access || !user) {
            return { ok: false, error: "Invalid credentials" };
          }

          set({
            accessToken: access,
            refreshToken: refresh,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: (user.role?.toLowerCase() ?? 'employee') as User['role'],
            },
            isAuthenticated: true,
            isHydrated: true,
          });

          return { ok: true };
        } catch (error: any) {
          const serverError =
            error.response?.data?.detail ||
            error.response?.data?.error ||
            "Invalid credentials";
          return { ok: false, error: serverError };
        }
      },

      logout: async () => {
        try {
          const refreshToken = get().refreshToken;
          if (refreshToken) {
            await api.post("/api/logout/", { refresh: refreshToken });
          }
        } catch {
          // Already expired — still clear local state
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isHydrated: true,
          });
        }
      },
    }),
    {
      name: "nimbus-auth-storage",

      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),

      onRehydrateStorage: () => async (state) => {
        // Use store's getState() instead of the closure's get()
        // since onRehydrateStorage is defined outside the (set, get) closure
        await useAuthStore.getState().initialize();
        rehydrateResolve?.();
      },
    }
  )
);

initCrossTabAuthSync();

