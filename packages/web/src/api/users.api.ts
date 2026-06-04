import client from './client';

export const usersApi = {
  list: () =>
    client.get('/users').then((r) => r.data),

  me: () =>
    client.get('/users/me').then((r) => r.data),

  dashboard: () =>
    client.get('/users/me/dashboard').then((r) => r.data),

  create: (data: any) =>
    client.post('/users', data).then((r) => r.data),

  update: (id: string, data: any) =>
    client.put(`/users/${id}`, data).then((r) => r.data),

  deactivate: (id: string) =>
    client.delete(`/users/${id}`),
};
