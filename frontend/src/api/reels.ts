import api from './client';
import type { Reel, ReelList, ReelCreate, ScriptUpdate } from '../types';

export const reelsApi = {
  create: (data: ReelCreate) => api.post<Reel>('/reels/', data),

  list: (page: number = 1, perPage: number = 10) =>
    api.get<ReelList>('/reels/', { params: { page, per_page: perPage } }),

  get: (id: number) => api.get<Reel>(`/reels/${id}`),

  updateScript: (id: number, data: ScriptUpdate) =>
    api.put<Reel>(`/reels/${id}/script`, data),

  generate: (id: number) => api.post<Reel>(`/reels/${id}/generate`),

  getDownloadUrl: (id: number) => `/api/reels/${id}/download`,

  download: (id: number) => api.get<Blob>(`/reels/${id}/download`, { responseType: 'blob' }),

  delete: (id: number) => api.delete(`/reels/${id}`),
};
