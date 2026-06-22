import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { tokenStorage } from '@/api/tokenStorage';
import { AppShell } from '@/components/layout/app-shell';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ location }) => {
    const hasToken = !!tokenStorage.getAccess();
    const hasUser = !!tokenStorage.getUser();

    if (!hasToken || !hasUser) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const syncFromStorage = useAuthStore((s) => s.syncFromStorage);
  const navigate = useNavigate();

  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login', search: { redirect: window.location.href } });
    }
  }, [isAuthenticated, navigate]);

  return <AppShell />;
}