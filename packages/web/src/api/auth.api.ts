import client from './client';

export const authApi = {
  login: (email: string, password: string) =>
    client.post('/auth/login', { email, password }).then((r) => r.data),

  refresh: () =>
    client.post('/auth/refresh').then((r) => r.data),

  logout: () =>
    client.post('/auth/logout'),
};
