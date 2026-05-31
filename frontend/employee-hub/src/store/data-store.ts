import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedDatabase } from "@/mock/seed";
import type {
  Announcement,
  AttendanceRecord,
  Department,
  Employee,
  LeaveRequest,
  User,
} from "@/types";

interface DataState {
  users: User[];
  employees: Employee[];
  departments: Department[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  announcements: Announcement[];

  addEmployee: (e: Omit<Employee, "id">) => void;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;

  addLeave: (l: Omit<LeaveRequest, "id" | "createdAt" | "status">) => void;
  updateLeaveStatus: (id: string, status: LeaveRequest["status"]) => void;

  addAnnouncement: (a: Omit<Announcement, "id" | "createdAt">) => void;
  removeAnnouncement: (id: string) => void;

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
      updateLeaveStatus: (id, status) =>
        set((s) => ({
          leaves: s.leaves.map((l) => (l.id === id ? { ...l, status } : l)),
        })),
      addAnnouncement: (a) =>
        set((s) => ({
          announcements: [
            { ...a, id: `a${Date.now()}`, createdAt: new Date().toISOString() },
            ...s.announcements,
          ],
        })),
      removeAnnouncement: (id) =>
        set((s) => ({ announcements: s.announcements.filter((a) => a.id !== id) })),
      resetSeed: () => set({ ...seedDatabase() }),
    }),
    { name: "hr-data" },
  ),
);