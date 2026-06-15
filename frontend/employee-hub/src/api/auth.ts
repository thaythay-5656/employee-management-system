import axios from "axios";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:8000";

interface LoginResponse {
  message: string;
  access: string;
  refresh: string;
}

export const authAPI = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const { data } = await axios.post<LoginResponse>(`${BASE_URL}/api/login/`, {
      username,
      password,
    });
    localStorage.setItem("access_token", data.access);
    localStorage.setItem("refresh_token", data.refresh);
    return data;
  },

  logout: async (): Promise<void> => {
    const refresh = localStorage.getItem("refresh_token");
    try {
      await axios.post(`${BASE_URL}/api/logout/`, { refresh });
    } catch {
      // ignore errors on logout
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
  },

  isAuthenticated: (): boolean => !!localStorage.getItem("access_token"),
};