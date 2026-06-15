import { useState, useEffect, useCallback } from "react";
import {
  employeeAPI, departmentAPI, positionAPI,
  payrollAPI, leaveAPI, attendanceAPI,
  type Employee, type CreateEmployeePayload,
  type Department, type Position,
  type Payroll, type Leave, type Attendance,
} from "../api/services";

// ── Generic fetch hook ─────────────────────────────────────────────────────
function useFetch<T>(fetchFn: () => Promise<T[]>) {
  const [data, setData]       = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchFn());
    } catch (err: any) {
      setError(err.response?.data?.detail ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, refetch: load };
}

// ── Mutation helper ────────────────────────────────────────────────────────
function useMutation<TArgs extends unknown[]>(
  fn: (...args: TArgs) => Promise<unknown>,
  onSuccess?: () => void
) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const mutate = async (...args: TArgs) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn(...args);
      onSuccess?.();
      return result;
    } catch (err: any) {
      const msg = err.response?.data
        ? JSON.stringify(err.response.data)
        : "Operation failed";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}

// ── EMPLOYEES ──────────────────────────────────────────────────────────────
export function useEmployees() {
  return useFetch<Employee>(employeeAPI.getAll);
}

export function useEmployeeMutations(onSuccess?: () => void) {
  const create = useMutation((data: CreateEmployeePayload) => employeeAPI.create(data), onSuccess);
  const update = useMutation((id: number, data: Partial<CreateEmployeePayload>) => employeeAPI.update(id, data), onSuccess);
  const remove = useMutation((id: number) => employeeAPI.delete(id), onSuccess);
  return {
    createEmployee:  create.mutate,
    updateEmployee:  update.mutate,
    deleteEmployee:  remove.mutate,
    loading: create.loading || update.loading || remove.loading,
    error:   create.error   || update.error   || remove.error,
  };
}

// ── DEPARTMENTS ────────────────────────────────────────────────────────────
export function useDepartments() {
  return useFetch<Department>(departmentAPI.getAll);
}

export function useDepartmentMutations(onSuccess?: () => void) {
  const create = useMutation((data: Omit<Department, "id">) => departmentAPI.create(data), onSuccess);
  const update = useMutation((id: number, data: Omit<Department, "id">) => departmentAPI.update(id, data), onSuccess);
  const remove = useMutation((id: number) => departmentAPI.delete(id), onSuccess);
  return {
    createDepartment: create.mutate,
    updateDepartment: update.mutate,
    deleteDepartment: remove.mutate,
    loading: create.loading || update.loading || remove.loading,
    error:   create.error   || update.error   || remove.error,
  };
}

// ── POSITIONS ──────────────────────────────────────────────────────────────
export function usePositions() {
  return useFetch<Position>(positionAPI.getAll);
}

export function usePositionMutations(onSuccess?: () => void) {
  const create = useMutation((data: Omit<Position, "id">) => positionAPI.create(data), onSuccess);
  const update = useMutation((id: number, data: Omit<Position, "id">) => positionAPI.update(id, data), onSuccess);
  const remove = useMutation((id: number) => positionAPI.delete(id), onSuccess);
  return {
    createPosition: create.mutate,
    updatePosition: update.mutate,
    deletePosition: remove.mutate,
    loading: create.loading || update.loading || remove.loading,
    error:   create.error   || update.error   || remove.error,
  };
}

// ── PAYROLL ────────────────────────────────────────────────────────────────
export function usePayroll() {
  return useFetch<Payroll>(payrollAPI.getAll);
}

export function usePayrollMutations(onSuccess?: () => void) {
  const create = useMutation(
    (data: Omit<Payroll, "id" | "total_salary">) => payrollAPI.create(data),
    onSuccess
  );
  return { createPayroll: create.mutate, loading: create.loading, error: create.error };
}

// ── LEAVE ──────────────────────────────────────────────────────────────────
export function useLeaves() {
  return useFetch<Leave>(leaveAPI.getAll);
}

export function useLeaveMutations(onSuccess?: () => void) {
  const create  = useMutation(
    (data: Omit<Leave, "id" | "status" | "approved_by" | "requested_at">) => leaveAPI.create(data),
    onSuccess
  );
  const approve = useMutation((id: number) => leaveAPI.approve(id), onSuccess);
  const reject  = useMutation((id: number) => leaveAPI.reject(id),  onSuccess);
  return {
    createLeave:  create.mutate,
    approveLeave: approve.mutate,
    rejectLeave:  reject.mutate,
    loading: create.loading || approve.loading || reject.loading,
    error:   create.error   || approve.error   || reject.error,
  };
}

// ── ATTENDANCE ─────────────────────────────────────────────────────────────
export function useAttendance() {
  return useFetch<Attendance>(attendanceAPI.getAll);
}

export function useAttendanceMutations(onSuccess?: () => void) {
  const create = useMutation((data: Omit<Attendance, "id">) => attendanceAPI.create(data), onSuccess);
  const update = useMutation((id: number, data: Partial<Attendance>) => attendanceAPI.update(id, data), onSuccess);
  const patch = useMutation((id: number, data: Partial<Attendance>) => attendanceAPI.partialUpdate(id, data), onSuccess);
  return {
    createAttendance: create.mutate,
    updateAttendance: update.mutate,
    patchAttendance: patch.mutate,
    loading: create.loading || update.loading || patch.loading,
    error:   create.error   || update.error || patch.error,
  };
}