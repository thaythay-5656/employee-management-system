import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { tokenStorage, type StoredUser } from '../api/tokenStorage';

interface AuthContextValue {
  user: StoredUser | null;
  isAuthenticated: boolean;
  setUser: (user: StoredUser | null) => void;
  refreshFromStorage: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<StoredUser | null>(() => tokenStorage.getUser());

  const setUser = useCallback((u: StoredUser | null) => {
    setUserState(u);
    if (u) {
      tokenStorage.setUser(u);
    } else {
      tokenStorage.clear();
    }
  }, []);

  const refreshFromStorage = useCallback(() => {
    setUserState(tokenStorage.getUser());
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, setUser, refreshFromStorage }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}