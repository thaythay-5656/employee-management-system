import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore, waitForAuthRehydration } from "@/store/auth-store";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // SSR: always redirect to login (no localStorage on server)
    if (typeof window === "undefined") {
      throw redirect({ to: "/login" });
    }

    try {
      const raw = localStorage.getItem("nimbus-auth-storage"); // persisted zustand key
      const parsed = raw ? JSON.parse(raw) : null;

      // If we have an explicit `isAuthenticated` flag, use it.
      const authed = parsed?.state?.isAuthenticated;

      // If not explicitly authenticated, but there's a stored refresh token,
      // wait for rehydration so we don't prematurely redirect to login.
      const hasRefresh = !!parsed?.state?.refreshToken;

      if (authed) {
        throw redirect({ to: "/dashboard" });
      }

      if (hasRefresh) {
        // Wait for the store to rehydrate and attempt refresh
        await waitForAuthRehydration();
        const state = useAuthStore.getState();
        if (state.isAuthenticated) {
          throw redirect({ to: "/dashboard" });
        }
        throw redirect({ to: "/login" });
      }

      throw redirect({ to: "/login" });
    } catch (e) {
      if ((e as { isRedirect?: boolean })?.isRedirect) throw e;
      throw redirect({ to: "/login" });
    }
  },
  component: () => null,
});
