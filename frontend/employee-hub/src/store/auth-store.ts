// import { create } from "zustand";
// import { persist } from "zustand/middleware";
// import type { Role, User } from "@/types";
// import { useDataStore } from "./data-store";

// interface AuthState {
//   user: Omit<User, "password"> | null;
//   isAuthenticated: boolean;
//   login: (email: string, password: string) => { ok: boolean; error?: string };
//   register: (email: string, password: string, role?: Role) => { ok: boolean; error?: string };
//   logout: () => void;
// }

// export const useAuthStore = create<AuthState>()(
//   persist(
//     (set) => ({
//       user: null,
//       isAuthenticated: false,
//       login: (email, password) => {
//         const users = useDataStore.getState().users;
//         const employees = useDataStore.getState().employees;
//         const id = email.trim().toLowerCase();
//         let found = users.find(
//           (u) => u.email.toLowerCase() === id && u.password === password,
//         );
//         if (!found) {
//           const emp = employees.find(
//             (e) =>
//               (e.username?.toLowerCase() === id || e.email.toLowerCase() === id) &&
//               e.password === password,
//           );
//           if (emp) {
//             found = users.find((u) => u.employeeId === emp.id) ?? {
//               id: `u-${emp.id}`,
//               email: emp.email,
//               password: emp.password ?? password,
//               role: emp.role === "manager" ? "manager" : "employee",
//               employeeId: emp.id,
//             };
//           }
//         }
//         if (!found) return { ok: false, error: "Invalid email or password" };
//         const { password: _pw, ...safe } = found;
//         set({ user: safe, isAuthenticated: true });
//         return { ok: true };
//       },
//       register: (email, password, role = "employee") => {
//         const data = useDataStore.getState();
//         if (data.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
//           return { ok: false, error: "Email already registered" };
//         }
//         const newUser: User = {
//           id: `u${Date.now()}`,
//           email,
//           password,
//           role,
//         };
//         useDataStore.setState({ users: [...data.users, newUser] });
//         const { password: _pw, ...safe } = newUser;
//         set({ user: safe, isAuthenticated: true });
//         return { ok: true };
//       },
//       logout: () => set({ user: null, isAuthenticated: false }),
//     }),
//     { name: "hr-auth" },
//   ),
// );


// ════════════════════════════════════════════════════════════════════════════
// FIX 2 — src/store/auth-store.ts
// REPLACE your entire auth-store.ts with this file
// ════════════════════════════════════════════════════════════════════════════

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "@/api/auth";

// Role type — must match what Django sends in the JWT
// "admin" | "manager" | "employee"
export type Role = "admin" | "manager" | "employee";

interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: Role;
  employeeId: number | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

// ── Helper: safely decode JWT payload (no library needed) ─────────────────
function decodeJWT(token: string): Record<string, unknown> {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

// ── Helper: map any role string to our 3 valid roles ─────────────────────
function normalizeRole(raw: unknown): Role {
  if (raw === "admin" || raw === "manager" || raw === "employee") return raw;
  // Your old sidebar had "hr" role — map it to admin so it gets full nav
  if (raw === "hr") return "admin";
  return "employee"; // safe default
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      // ── Login: call Django, decode JWT, store role ───────────────────────
      login: async (username: string, password: string) => {
        try {
          // authAPI.login calls POST /api/login/ and stores tokens in localStorage
          const data = await authAPI.login(username, password);

          // Decode the access token to read the custom claims we added in views.py
          const payload = decodeJWT(data.access);

          const user: AuthUser = {
            id:         Number(payload.user_id)   ?? 0,
            username:   String(payload.username   ?? username),
            email:      String(payload.email      ?? ""),
            role:       normalizeRole(payload.role),          // ← THE KEY FIX
            employeeId: payload.employee_id != null
                          ? Number(payload.employee_id)
                          : null,
          };

          set({ user, isAuthenticated: true });
          return { ok: true };

        } catch (err: unknown) {
          const error = err as { response?: { data?: { error?: string } } };
          const msg = error.response?.data?.error ?? "Invalid credentials";
          return { ok: false, error: msg };
        }
      },

      // ── Logout: call Django to blacklist refresh token ───────────────────
      logout: async () => {
        await authAPI.logout();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "hr-auth",   // localStorage key — kept the same so existing sessions still work
      // Only persist the user object and isAuthenticated flag, not the functions
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);