import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { positionApi } from '../endpoints/position';
import { queryKeys } from '../queryKeys';
import type { PositionInput } from '../../types/api';

export function usePositions() {
  return useQuery({
    queryKey: queryKeys.positions,
    queryFn: positionApi.list,
  });
}

export function usePosition(id: number) {
  return useQuery({
    queryKey: queryKeys.position(id),
    queryFn: () => positionApi.retrieve(id),
    enabled: !!id,
  });
}

export function useCreatePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PositionInput) => positionApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.positions }),
  });
}

export function useUpdatePosition(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<PositionInput>) => positionApi.partialUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.positions });
      queryClient.invalidateQueries({ queryKey: queryKeys.position(id) });
    },
  });
}

export function useDeletePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => positionApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.positions }),
  });
}