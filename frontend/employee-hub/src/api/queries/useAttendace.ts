import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceApi } from '../endpoints/attendance';
import { queryKeys } from '../queryKeys';
import type { AttendanceInput } from '../../types/api';

export function useAttendance() {
  return useQuery({
    queryKey: queryKeys.attendance,
    queryFn: attendanceApi.list,
  });
}

export function useCreateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AttendanceInput) => attendanceApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendance }),
  });
}

export function useUpdateAttendance(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AttendanceInput>) => attendanceApi.partialUpdate(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.attendance }),
  });
}