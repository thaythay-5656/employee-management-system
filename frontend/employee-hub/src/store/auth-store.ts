import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, User } from "@/types";
import { useDataStore } from "./data-store";

interface AuthState {
  user: Omit<User, "password"> | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (email: string, password: string, role?: Role) => { ok: boolean; error?: string };
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (email, password) => {
        const users = useDataStore.getState().users;
        const employees = useDataStore.getState().employees;
        const id = email.trim().toLowerCase();
        let found = users.find(
          (u) => u.email.toLowerCase() === id && u.password === password,
        );
        if (!found) {
          const emp = employees.find(
            (e) =>
              (e.username?.toLowerCase() === id || e.email.toLowerCase() === id) &&
              e.password === password,
          );
          if (emp) {
            found = users.find((u) => u.employeeId === emp.id) ?? {
              id: `u-${emp.id}`,
              email: emp.email,
              password: emp.password ?? password,
              role: emp.role === "manager" ? "manager" : "employee",
              employeeId: emp.id,
            };
          }
        }
        if (!found) return { ok: false, error: "Invalid email or password" };
        const { password: _pw, ...safe } = found;
        set({ user: safe, isAuthenticated: true });
        return { ok: true };
      },
      register: (email, password, role = "employee") => {
        const data = useDataStore.getState();
        if (data.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
          return { ok: false, error: "Email already registered" };
        }
        const newUser: User = {
          id: `u${Date.now()}`,
          email,
          password,
          role,
        };
        useDataStore.setState({ users: [...data.users, newUser] });
        const { password: _pw, ...safe } = newUser;
        set({ user: safe, isAuthenticated: true });
        return { ok: true };
      },
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: "hr-auth" },
  ),
);