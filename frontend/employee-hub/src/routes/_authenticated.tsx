// import { createFileRoute, redirect } from "@tanstack/react-router";
// import { AppShell } from "@/components/layout/app-shell";

// export const Route = createFileRoute("/_authenticated")({
//   beforeLoad: () => {
//     if (typeof window === "undefined") return;
//     try {
//       const raw = localStorage.getItem("hr-auth");
//       const parsed = raw ? JSON.parse(raw) : null;
//       if (!parsed?.state?.isAuthenticated) {
//         throw redirect({ to: "/login" });
//       }
//     } catch (e) {
//       if ((e as { isRedirect?: boolean })?.isRedirect) throw e;
//       throw redirect({ to: "/login" });
//     }
//   },
//   component: AppShell,
// });

// ════════════════════════════════════════════════════════════════════════════
// FIX 3 — src/routes/_authenticated.tsx
// REPLACE your entire _authenticated.tsx with this file
// ════════════════════════════════════════════════════════════════════════════

import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;

    // ── Check 1: is there a JWT access token? ──────────────────────────────
    // auth-store.ts stores the JWT at "access_token" (via authAPI.login)
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw redirect({ to: "/login" });
    }

    // ── Check 2: is the token expired? ────────────────────────────────────
    // Decode the payload — no library needed, just base64 decode part 2
    try {
      const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));
      const isExpired = typeof payload.exp === "number" && payload.exp * 1000 < Date.now();
      if (isExpired) {
        // Expired — clear tokens, go to login
        // The Axios interceptor in client.ts will also try auto-refresh,
        // but we block the route here to avoid a flash of content
        localStorage.removeItem("access_token");
        throw redirect({ to: "/login" });
      }
    } catch (e: unknown) {
      // Re-throw TanStack Router redirect objects
      if (typeof e === "object" && e !== null && "isRedirect" in e) throw e;
      // Malformed token — clear and redirect
      localStorage.removeItem("access_token");
      throw redirect({ to: "/login" });
    }

    // ── Check 3: does the Zustand store have the user? ─────────────────────
    // The persisted store saves to "hr-auth" key in localStorage
    // If it's missing (e.g. cleared storage), send back to login
    const raw = localStorage.getItem("hr-auth");
    if (!raw) {
      localStorage.removeItem("access_token");
      throw redirect({ to: "/login" });
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.state?.isAuthenticated || !parsed?.state?.user) {
        throw redirect({ to: "/login" });
      }
    } catch (e: unknown) {
      if (typeof e === "object" && e !== null && "isRedirect" in e) throw e;
      throw redirect({ to: "/login" });
    }
  },
  component: AppShell,
});