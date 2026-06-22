import { api } from '../client';
import type { Department, DepartmentInput } from '../../types/api';

const BASE = '/department';

export const departmentApi = {
  list: () => api.get<Department[]>(`${BASE}/`),
  retrieve: (id: number) => api.get<Department>(`${BASE}/${id}/`),
  create: (data: DepartmentInput) => api.post<Department>(`${BASE}/`, data),
  update: (id: number, data: DepartmentInput) => api.put<Department>(`${BASE}/${id}/`, data),
  partialUpdate: (id: number, data: Partial<DepartmentInput>) =>
    api.patch<Department>(`${BASE}/${id}/`, data),
  remove: (id: number) => api.delete<void>(`${BASE}/${id}/`),
};