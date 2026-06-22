import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveApi } from '../endpoints/leave';
import { queryKeys } from '../queryKeys';
import type { LeaveInput, LeaveStatus } from '../../types/api';

export function useLeaves() {
  return useQuery({
    queryKey: queryKeys.leaves,
    queryFn: leaveApi.list,
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LeaveInput) => leaveApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.leaves }),
  });
}

/** For admins/managers approving or rejecting a leave request. */
export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, approvedBy }: { id: number; status: LeaveStatus; approvedBy?: number | null }) =>
      leaveApi.partialUpdate(id, { status, approved_by: approvedBy }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.leaves }),
  });
}

export function useUpdateLeave(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<LeaveInput>) => leaveApi.partialUpdate(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.leaves }),
  });
}