import { api } from '../client';
import type { Leave, LeaveInput, LeaveStatus } from '../../types/api';

const BASE = '/leave';

// LeaveViewSet = CreateModelMixin + ListModelMixin + UpdateModelMixin.
// No retrieve or delete endpoints exist on the backend.
export const leaveApi = {
  list: () => api.get<Leave[]>(`${BASE}/`),
  create: (data: LeaveInput) => api.post<Leave>(`${BASE}/`, data),
  update: (id: number, data: LeaveInput & { status?: LeaveStatus; approved_by?: number | null }) =>
    api.put<Leave>(`${BASE}/${id}/`, data),
  partialUpdate: (
    id: number,
    data: Partial<LeaveInput> & { status?: LeaveStatus; approved_by?: number | null }
  ) => api.patch<Leave>(`${BASE}/${id}/`, data),
};