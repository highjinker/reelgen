import api from './client';
import type { TokenResponse } from '../types';

export const authApi = {
  signup: (data: { email: string; password: string; full_name: string; specialization?: string }) =>
    api.post<TokenResponse>('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    api.post<TokenResponse>('/auth/login', data),

  refresh: (refresh_token: string) =>
    api.post<TokenResponse>('/auth/refresh', { refresh_token }),
};
