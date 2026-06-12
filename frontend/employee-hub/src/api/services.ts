import client from "./client";

// ── Types matching your Django models ──────────────────────────────────────

export interface DjangoUser {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface Employee {
  id: number;
  user: DjangoUser;
  role: "admin" | "manager" | "employee";
  gender: "male" | "female" | "other";
  date_of_birth: string;
  phone: string;
  address: string;
  hire_date: string;
  salary: string;
  status: "active" | "inactive" | "terminated";
  department: number;
  position: number;
  profile_picture?: string;
}

export interface CreateEmployeePayload {
  user: { username: string; password: string; first_name: string; last_name: string; email: string };
  role: "admin" | "manager" | "employee";
  gender: "male" | "female" | "other";
  date_of_birth: string;
  phone: string;
  address: string;
  hire_date: string;
  salary: string | number;
  status: "active" | "inactive" | "terminated";
  department: number;
  position: number;
}

export interface Department {
  id: number;
  department_name: string;
}

export interface Position {
  id: number;
  position_name: string;
  description: string;
}

export interface Payroll {
  id: number;
  employee: number;
  pay_date: string;
  basic_salary: string;
  bonus: string;
  deduction: string;
  total_salary: string;
}

export interface Leave {
  id: number;
  employee: number;
  leave_type: "annual" | "sick" | "maternity" | "emergency" | "unpaid" | "other";
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  approved_by: number | null;
  requested_at: string;
}

export interface Attendance {
  id: number;
  employee: number;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: "present" | "absent" | "late" | "on_leave";
}

// ── API functions ──────────────────────────────────────────────────────────
// NOTE: Your Django URLs use SINGULAR form:
//   /api/employee/  /api/department/  /api/position/  etc.

export const employeeAPI = {
  getAll:        ()                          => client.get<Employee[]>("/api/employee/").then(r => r.data),
  getById:       (id: number)                => client.get<Employee>(`/api/employee/${id}/`).then(r => r.data),
  create:        (payload: CreateEmployeePayload) => client.post<Employee>("/api/employee/", payload).then(r => r.data),
  update:        (id: number, payload: Partial<CreateEmployeePayload>) => client.put<Employee>(`/api/employee/${id}/`, payload).then(r => r.data),
  partialUpdate: (id: number, payload: Partial<CreateEmployeePayload>) => client.patch<Employee>(`/api/employee/${id}/`, payload).then(r => r.data),
  delete:        (id: number)                => client.delete(`/api/employee/${id}/`).then(r => r.data),
};

export const departmentAPI = {
  getAll:        ()                          => client.get<Department[]>("/api/department/").then(r => r.data),
  getById:       (id: number)                => client.get<Department>(`/api/department/${id}/`).then(r => r.data),
  create:        (payload: Omit<Department, "id">) => client.post<Department>("/api/department/", payload).then(r => r.data),
  update:        (id: number, payload: Omit<Department, "id">) => client.put<Department>(`/api/department/${id}/`, payload).then(r => r.data),
  delete:        (id: number)                => client.delete(`/api/department/${id}/`).then(r => r.data),
};

export const positionAPI = {
  getAll:        ()                          => client.get<Position[]>("/api/position/").then(r => r.data),
  getById:       (id: number)                => client.get<Position>(`/api/position/${id}/`).then(r => r.data),
  create:        (payload: Omit<Position, "id">) => client.post<Position>("/api/position/", payload).then(r => r.data),
  update:        (id: number, payload: Omit<Position, "id">) => client.put<Position>(`/api/position/${id}/`, payload).then(r => r.data),
  delete:        (id: number)                => client.delete(`/api/position/${id}/`).then(r => r.data),
};

// PayrollViewSet: Create + List only (no update/delete)
export const payrollAPI = {
  getAll:  ()                     => client.get<Payroll[]>("/api/payroll/").then(r => r.data),
  create:  (payload: Omit<Payroll, "id" | "total_salary">) => client.post<Payroll>("/api/payroll/", payload).then(r => r.data),
};

// LeaveViewSet: Create + List + Update
export const leaveAPI = {
  getAll:        ()                => client.get<Leave[]>("/api/leave/").then(r => r.data),
  getById:       (id: number)      => client.get<Leave>(`/api/leave/${id}/`).then(r => r.data),
  create:        (payload: Omit<Leave, "id" | "status" | "approved_by" | "requested_at">) => client.post<Leave>("/api/leave/", payload).then(r => r.data),
  update:        (id: number, payload: Partial<Leave>) => client.put<Leave>(`/api/leave/${id}/`, payload).then(r => r.data),
  partialUpdate: (id: number, payload: Partial<Leave>) => client.patch<Leave>(`/api/leave/${id}/`, payload).then(r => r.data),
  approve:       (id: number)      => leaveAPI.partialUpdate(id, { status: "approved" }),
  reject:        (id: number)      => leaveAPI.partialUpdate(id, { status: "rejected" }),
};

// AttendanceViewSet: Create + List + Update
export const attendanceAPI = {
  getAll:        ()                => client.get<Attendance[]>("/api/attendance/").then(r => r.data),
  getById:       (id: number)      => client.get<Attendance>(`/api/attendance/${id}/`).then(r => r.data),
  create:        (payload: Omit<Attendance, "id">) => client.post<Attendance>("/api/attendance/", payload).then(r => r.data),
  update:        (id: number, payload: Partial<Attendance>) => client.put<Attendance>(`/api/attendance/${id}/`, payload).then(r => r.data),
  partialUpdate: (id: number, payload: Partial<Attendance>) => client.patch<Attendance>(`/api/attendance/${id}/`, payload).then(r => r.data),
};