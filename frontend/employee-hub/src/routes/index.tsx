import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("hr-auth");
        const parsed = raw ? JSON.parse(raw) : null;
        const authed = parsed?.state?.isAuthenticated;
        throw redirect({ to: authed ? "/dashboard" : "/login" });
      } catch (e) {
        if ((e as { isRedirect?: boolean })?.isRedirect) throw e;
        throw redirect({ to: "/login" });
      }
    }
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
