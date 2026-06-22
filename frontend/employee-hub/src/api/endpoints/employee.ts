import { api } from '../client';
import type { Employee, EmployeeInput } from '../../types/api';

const BASE = '/employee';

/**
 * Employee writes use multipart/form-data because of profile_picture (ImageField)
 * and the nested `user` object. DRF's nested serializer with multipart expects
 * dotted keys: user.username, user.email, etc.
 */
function buildEmployeeFormData(data: Partial<EmployeeInput>): FormData {
  const fd = new FormData();

  const { user, profile_picture, ...rest } = data;

  if (user) {
    Object.entries(user).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        fd.append(`user.${key}`, String(value));
      }
    });
  }

  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      fd.append(key, String(value));
    }
  });

  if (profile_picture instanceof File) {
    fd.append('profile_picture', profile_picture);
  }

  return fd;
}

export const employeeApi = {
  list: () => api.get<Employee[]>(`${BASE}/`),
  retrieve: (id: number) => api.get<Employee>(`${BASE}/${id}/`),
  create: (data: EmployeeInput) => api.post<Employee>(`${BASE}/`, buildEmployeeFormData(data)),
  update: (id: number, data: Partial<EmployeeInput>) =>
    api.put<Employee>(`${BASE}/${id}/`, buildEmployeeFormData(data)),
  partialUpdate: (id: number, data: Partial<EmployeeInput>) =>
    api.patch<Employee>(`${BASE}/${id}/`, buildEmployeeFormData(data)),
  remove: (id: number) => api.delete<void>(`${BASE}/${id}/`),
};