import { api } from '../client';
import type { Attendance, AttendanceInput } from '../../types/api';

const BASE = '/attendance';

// AttendanceViewSet = CreateModelMixin + ListModelMixin + UpdateModelMixin.
// No retrieve or delete endpoints exist on the backend.
export const attendanceApi = {
  list: () => api.get<Attendance[]>(`${BASE}/`),
  create: (data: AttendanceInput) => api.post<Attendance>(`${BASE}/`, data),
  update: (id: number, data: AttendanceInput) => api.put<Attendance>(`${BASE}/${id}/`, data),
  partialUpdate: (id: number, data: Partial<AttendanceInput>) =>
    api.patch<Attendance>(`${BASE}/${id}/`, data),
};