import { api } from './client';
import { tokenStorage } from './tokenStorage';
import type { LoginRequest, LoginResponse } from '../types/api';

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const data = await api.post<LoginResponse>('/login/', credentials, { auth: false });
  tokenStorage.setTokens(data.access, data.refresh);
  tokenStorage.setUser(data.user);
  return data;
}

export async function logout(): Promise<void> {
  const refresh = tokenStorage.getRefresh();
  try {
    if (refresh) {
      await api.post('/logout/', { refresh });
    }
  } finally {
    tokenStorage.clear();
  }
}

export function getCurrentUser() {
  return tokenStorage.getUser();
}

export function isAuthenticated(): boolean {
  return !!tokenStorage.getAccess();
}