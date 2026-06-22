// =========================
// ENUM TYPES
// =========================

export type LeaveStatus = 'pending' | 'approved' | 'rejected';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'on_leave';
export type Role = 'admin' | 'manager' | 'employee';
export type Gender = 'male' | 'female' | 'other';
export type LeaveType = 'annual' | 'sick' | 'maternity' | 'emergency' | 'unpaid' | 'other';

// =========================
// USER
// =========================

export interface User {
  id?: number;
  username: string;
  password?: string; // write-only
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
}

// =========================
// DEPARTMENT
// =========================

export interface Department {
  id: number;
  department_name: string;
}

export type DepartmentInput = Omit<Department, 'id'>;

// =========================
// POSITION
// =========================

export interface Position {
  id: number;
  position_name: string;
  description: string;
}

export type PositionInput = Omit<Position, 'id'>;

// =========================
// EMPLOYEE
// =========================

export interface Employee {
  id: number;
  user: User;
  role: Role;
  gender: Gender;
  date_of_birth: string; // YYYY-MM-DD
  phone: string;
  address: string;
  hire_date: string;
  salary: string; // DecimalField -> string in DRF
  department: number; // FK id
  position: number; // FK id
  profile_picture?: string | null;
}

export type EmployeeInput = Omit<Employee, 'id' | 'profile_picture'> & {
  profile_picture?: File | null;
};

// =========================
// ATTENDANCE
// =========================

export interface Attendance {
  id: number;
  employee: number; // FK id
  attendance_date: string;
  check_in?: string | null;
  check_out?: string | null;
  status: AttendanceStatus;
}

export type AttendanceInput = Omit<Attendance, 'id'>;

// =========================
// LEAVE
// =========================

export interface Leave {
  id: number;
  employee: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveStatus;
  approved_by?: number | null;
  requested_at: string;
}

export type LeaveInput = Omit<Leave, 'id' | 'requested_at' | 'status' | 'approved_by'>;

// =========================
// PAYROLL
// =========================

export interface Payroll {
  id: number;
  employee: number;
  pay_date: string;
  basic_salary: string;
  bonus: string;
  deduction: string;
  total_salary: string; // read-only, computed server-side
}

export type PayrollInput = Omit<Payroll, 'id' | 'total_salary'>;

// =========================
// ANNOUNCEMENT
// =========================

export interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export type AnnouncementInput = Omit<Announcement, 'id' | 'created_at' | 'updated_at'>;

// =========================
// AUTH
// =========================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  refresh: string;
  access: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: Role;
  };
}

export interface ApiError {
  detail?: string;
  error?: string;
  [key: string]: unknown;
}