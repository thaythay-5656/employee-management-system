import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../endpoints/employee';
import { queryKeys } from '../queryKeys';
import type { EmployeeInput } from '../../types/api';

export function useEmployees() {
  return useQuery({
    queryKey: queryKeys.employees,
    queryFn: employeeApi.list,
  });
}

export function useEmployee(id: number) {
  return useQuery({
    queryKey: queryKeys.employee(id),
    queryFn: () => employeeApi.retrieve(id),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EmployeeInput) => employeeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees });
    },
  });
}

export function useUpdateEmployee(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<EmployeeInput>) => employeeApi.partialUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees });
      queryClient.invalidateQueries({ queryKey: queryKeys.employee(id) });
    },
  });
}

/**
 * Variant that takes the id at call-time instead of at hook-creation time.
 * Use this in forms/dialogs where the target id isn't known until submit
 * (e.g. an "add or edit" dialog sharing one mutation).
 */
export function useUpdateEmployeeById() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EmployeeInput> }) =>
      employeeApi.partialUpdate(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees });
      queryClient.invalidateQueries({ queryKey: queryKeys.employee(variables.id) });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => employeeApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees });
    },
  });
}