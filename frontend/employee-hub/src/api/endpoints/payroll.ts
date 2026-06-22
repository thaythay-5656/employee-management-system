import { api } from '../client';
import type { Payroll, PayrollInput } from '../../types/api';

const BASE = '/payroll';

// PayrollViewSet = CreateModelMixin + ListModelMixin only.
// No retrieve, update, or delete endpoints exist on the backend.
export const payrollApi = {
  list: () => api.get<Payroll[]>(`${BASE}/`),
  create: (data: PayrollInput) => api.post<Payroll>(`${BASE}/`, data),
};