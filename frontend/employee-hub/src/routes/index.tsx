import { createFileRoute, redirect } from '@tanstack/react-router';
import { tokenStorage } from '@/api/tokenStorage';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const hasToken = !!tokenStorage.getAccess();
    const hasUser = !!tokenStorage.getUser();

    throw redirect({ to: hasToken && hasUser ? '/dashboard' : '/login' });
  },
});
