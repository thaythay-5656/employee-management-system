import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollApi } from '../endpoints/payroll';
import { queryKeys } from '../queryKeys';
import type { PayrollInput } from '../../types/api';

export function usePayrolls() {
  return useQuery({
    queryKey: queryKeys.payrolls,
    queryFn: payrollApi.list,
  });
}

export function useCreatePayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PayrollInput) => payrollApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.payrolls }),
  });
}