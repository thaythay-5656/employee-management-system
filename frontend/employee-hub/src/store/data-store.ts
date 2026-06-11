import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedDatabase } from "@/mock/seed";
import type {
  Announcement,
  AttendanceRecord,
  AuditLog,
  Department,
  Employee,
  LeaveRequest,
  Notification,
  PayrollRecord,
  Position,
  User,
} from "@/types";

interface DataState {
  users: User[];
  employees: Employee[];
  departments: Department[];
  positions: Position[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  payrolls: PayrollRecord[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  notifications: Notification[];

  addEmployee: (e: Omit<Employee, "id">) => void;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  addUser: (u: Omit<User, "id">) => void;
  updateUser: (id: string, patch: Partial<User>) => void;
  deleteUser: (id: string) => void;

  addDepartment: (d: Omit<Department, "id">) => void;
  updateDepartment: (id: string, patch: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;

  addPosition: (p: Omit<Position, "id">) => void;
  updatePosition: (id: string, patch: Partial<Position>) => void;
  deletePosition: (id: string) => void;

  addLeave: (l: Omit<LeaveRequest, "id" | "createdAt" | "status">) => void;
  updateLeaveStatus: (id: string, status: LeaveRequest["status"], comment?: string, approvedBy?: string) => void;
  cancelLeave: (id: string) => void;

  addAnnouncement: (a: Omit<Announcement, "id" | "createdAt">) => void;
  removeAnnouncement: (id: string) => void;

  generatePayroll: (month: string) => void;

  logAudit: (actor: string, action: string, target?: string) => void;
  addNotification: (n: Omit<Notification, "id" | "createdAt" | "read">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  resetSeed: () => void;
}

const seed = seedDatabase();

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      ...seed,
      addEmployee: (e) =>
        set((s) => ({ employees: [{ ...e, id: `e${Date.now()}` }, ...s.employees] })),
      updateEmployee: (id, patch) =>
        set((s) => ({
          employees: s.employees.map((emp) => (emp.id === id ? { ...emp, ...patch } : emp)),
        })),
      deleteEmployee: (id) =>
        set((s) => ({ employees: s.employees.filter((emp) => emp.id !== id) })),

      addUser: (u) => set((s) => ({ users: [{ ...u, id: `u${Date.now()}` }, ...s.users] })),
      updateUser: (id, patch) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...patch } : u)) })),
      deleteUser: (id) => set((s) => ({ users: s.users.filter((u) => u.id !== id) })),

      addDepartment: (d) =>
        set((s) => ({ departments: [{ ...d, id: `d${Date.now()}` }, ...s.departments] })),
      updateDepartment: (id, patch) =>
        set((s) => ({
          departments: s.departments.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),
      deleteDepartment: (id) =>
        set((s) => ({ departments: s.departments.filter((d) => d.id !== id) })),

      addPosition: (p) =>
        set((s) => ({ positions: [{ ...p, id: `p${Date.now()}` }, ...s.positions] })),
      updatePosition: (id, patch) =>
        set((s) => ({
          positions: s.positions.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      deletePosition: (id) =>
        set((s) => ({ positions: s.positions.filter((p) => p.id !== id) })),

      addLeave: (l) =>
        set((s) => ({
          leaves: [
            {
              ...l,
              id: `l${Date.now()}`,
              status: "pending",
              createdAt: new Date().toISOString(),
            },
            ...s.leaves,
          ],
        })),
      updateLeaveStatus: (id, status, comment, approvedBy) =>
        set((s) => ({
          leaves: s.leaves.map((l) =>
            l.id === id ? { ...l, status, comment: comment ?? l.comment, approvedBy: approvedBy ?? l.approvedBy } : l,
          ),
        })),
      cancelLeave: (id) =>
        set((s) => ({ leaves: s.leaves.filter((l) => l.id !== id) })),

      addAnnouncement: (a) =>
        set((s) => ({
          announcements: [
            { ...a, id: `a${Date.now()}`, createdAt: new Date().toISOString() },
            ...s.announcements,
          ],
        })),
      removeAnnouncement: (id) =>
        set((s) => ({ announcements: s.announcements.filter((a) => a.id !== id) })),

      generatePayroll: (month) =>
        set((s) => {
          const filtered = s.payrolls.filter((p) => p.month !== month);
          const fresh: PayrollRecord[] = s.employees.map((e) => {
            const base = e.salary / 12;
            const bonus = base * 0.1;
            const tax = base * 0.18;
            const deductions = base * 0.04;
            return {
              id: `${e.id}-${month}`,
              employeeId: e.id,
              month,
              base, bonus, tax, deductions,
              net: base + bonus - tax - deductions,
              status: "paid",
              generatedAt: new Date().toISOString(),
            };
          });
          return { payrolls: [...fresh, ...filtered] };
        }),

      logAudit: (actor, action, target) =>
        set((s) => ({
          auditLogs: [
            { id: `log${Date.now()}`, actor, action, target, createdAt: new Date().toISOString() },
            ...s.auditLogs,
          ].slice(0, 200),
        })),
      addNotification: (n) =>
        set((s) => ({
          notifications: [
            { ...n, id: `n${Date.now()}`, createdAt: new Date().toISOString(), read: false },
            ...s.notifications,
          ].slice(0, 50),
        })),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

      resetSeed: () => set({ ...seedDatabase() }),
    }),
    { name: "hr-data" },
  ),
);