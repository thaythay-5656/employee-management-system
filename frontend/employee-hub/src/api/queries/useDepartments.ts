import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentApi } from '../endpoints/department';
import { queryKeys } from '../queryKeys';
import type { DepartmentInput } from '../../types/api';

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments,
    queryFn: departmentApi.list,
  });
}

export function useDepartment(id: number) {
  return useQuery({
    queryKey: queryKeys.department(id),
    queryFn: () => departmentApi.retrieve(id),
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DepartmentInput) => departmentApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.departments }),
  });
}

export function useUpdateDepartment(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DepartmentInput>) => departmentApi.partialUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments });
      queryClient.invalidateQueries({ queryKey: queryKeys.department(id) });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => departmentApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.departments }),
  });
}