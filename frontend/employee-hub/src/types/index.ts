// FIX: removed "hr" — not a valid Django role
export type Role = "admin" | "manager" | "employee";

export interface User {
  id: string;
  email: string;
  password: string;
  role: Role;
  employeeId?: string;
}

export interface Employee {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  password?: string;
  hireDate?: string;
  role?: "manager" | "employee";
  email: string;
  phone: string;
  address: string;
  gender: "male" | "female" | "other";
  dateOfBirth: string;
  position: string;
  department: string;
  salary: number;
  joinDate: string;
  emergencyContact: string;
  avatar?: string;
  status: "active" | "inactive" | "on-leave";
}

export interface Department {
  id: string;
  name: string;
  managerId?: string;
  description: string;
}

export interface Position {
  id: string;
  title: string;
  department: string;
  grade: "Junior" | "Mid" | "Senior" | "Lead" | "Manager";
  baseSalary: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: "present" | "absent" | "late" | "on-leave";
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: "vacation" | "sick" | "emergency" | "unpaid";
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  comment?: string;
  approvedBy?: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  author: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  forRole?: Role;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  month: string;
  base: number;
  bonus: number;
  deductions: number;
  tax: number;
  net: number;
  status: "paid" | "pending";
  generatedAt: string;
}