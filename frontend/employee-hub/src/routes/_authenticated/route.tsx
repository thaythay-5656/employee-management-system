import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuthStore, waitForAuthRehydration } from "@/store/auth-store";
import { AppSidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

function hasPersistedSession() {
  if (typeof window === "undefined") return false;

  try {
    const raw = localStorage.getItem("nimbus-auth-storage");
    const parsed = raw ? JSON.parse(raw) : null;
    return !!parsed?.state?.refreshToken || !!parsed?.state?.accessToken;
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const state = useAuthStore.getState();

    console.log("BEFORE_LOAD", {
      isAuthenticated: state.isAuthenticated,
      isHydrated: state.isHydrated,
      path: location.pathname,
    });
    // Server-side: skip auth check entirely — localStorage doesn't exist on server
    if (typeof window === "undefined") return;

    const { isAuthenticated, isHydrated } = state;

    if (isHydrated) {
      if (!isAuthenticated) {
        throw redirect({
          to: "/login",
          search: { redirect: location.href },
        });
      }
      return;
    }

    if (!hasPersistedSession()) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }

    await waitForAuthRehydration();

    const nextState = useAuthStore.getState();

    console.log("BEFORE_LOAD AFTER REHYDRATE", {
      isAuthenticated: nextState.isAuthenticated,
      isHydrated: nextState.isHydrated,
      path: location.pathname,
    });

    if (!nextState.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const initialize = useAuthStore((s) => s.initialize);

  console.log("LAYOUT_RENDER", {
    isAuthenticated,
    isHydrated,
  });

  useEffect(() => {
    // Run token check once on mount (client only)
    if (!isHydrated) {
      initialize();
    }
  }, []);

  // Still checking tokens — show spinner
  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Restoring session…</p>
        </div>
      </div>
    );
  }

  // Token check done but not authenticated — redirect to login
  if (!isAuthenticated) {
    throw redirect({ to: "/login" });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <AppSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative z-50 flex w-64 flex-col">
            <AppSidebar onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
