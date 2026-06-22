import { api } from '../client';
import type { Announcement, AnnouncementInput } from '../../types/api';

const BASE = '/announcement';

export const announcementApi = {
  list: () => api.get<Announcement[]>(`${BASE}/`),
  retrieve: (id: number) => api.get<Announcement>(`${BASE}/${id}/`),
  create: (data: AnnouncementInput) => api.post<Announcement>(`${BASE}/`, data),
  update: (id: number, data: AnnouncementInput) => api.put<Announcement>(`${BASE}/${id}/`, data),
  partialUpdate: (id: number, data: Partial<AnnouncementInput>) =>
    api.patch<Announcement>(`${BASE}/${id}/`, data),
  remove: (id: number) => api.delete<void>(`${BASE}/${id}/`),
};