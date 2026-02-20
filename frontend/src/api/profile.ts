import api from './client';
import type { User } from '../types';

export const profileApi = {
  getProfile: () => api.get<User>('/users/me'),

  updateProfile: (data: { full_name?: string; specialization?: string }) =>
    api.put<User>('/users/me', data),

  uploadPhoto: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<User>('/users/me/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadVoiceSample: (blob: Blob, filename: string = 'voice.wav') => {
    const formData = new FormData();
    formData.append('file', blob, filename);
    return api.post<User>('/users/me/voice-sample', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
