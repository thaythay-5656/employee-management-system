import { api } from '../client';
import type { Position, PositionInput } from '../../types/api';

const BASE = '/position';

export const positionApi = {
  list: () => api.get<Position[]>(`${BASE}/`),
  retrieve: (id: number) => api.get<Position>(`${BASE}/${id}/`),
  create: (data: PositionInput) => api.post<Position>(`${BASE}/`, data),
  update: (id: number, data: PositionInput) => api.put<Position>(`${BASE}/${id}/`, data),
  partialUpdate: (id: number, data: Partial<PositionInput>) =>
    api.patch<Position>(`${BASE}/${id}/`, data),
  remove: (id: number) => api.delete<void>(`${BASE}/${id}/`),
};