import { api } from './api';

export const authApi = {
  register: (data: {
    email: string;
    username: string;
    password: string;
    fullName?: string;
    phone: string;
  }) =>
    api.post<{ user: any; token: string }>('/auth/register', data),

  login: (data: {
    email: string;
    password: string;
  }) =>
    api.post<{ user: any; token: string }>('/auth/login', data),
};