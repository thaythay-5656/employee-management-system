export type Role = "admin" | "hr" | "employee";

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
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
  author: string;
}