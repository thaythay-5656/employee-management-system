import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementApi } from '../endpoints/announcement';
import { queryKeys } from '../queryKeys';
import type { AnnouncementInput } from '../../types/api';

export function useAnnouncements() {
  return useQuery({
    queryKey: queryKeys.announcements,
    queryFn: announcementApi.list,
  });
}

export function useAnnouncement(id: number) {
  return useQuery({
    queryKey: queryKeys.announcement(id),
    queryFn: () => announcementApi.retrieve(id),
    enabled: !!id,
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AnnouncementInput) => announcementApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.announcements }),
  });
}

export function useUpdateAnnouncement(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AnnouncementInput>) => announcementApi.partialUpdate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
      queryClient.invalidateQueries({ queryKey: queryKeys.announcement(id) });
    },
  });
}

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => announcementApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.announcements }),
  });
}