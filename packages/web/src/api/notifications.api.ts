import client from './client';

export const notificationsApi = {
  list: () =>
    client.get('/notifications').then((r) => r.data),

  markRead: (id: string) =>
    client.put(`/notifications/${id}/read`),

  markAllRead: () =>
    client.put('/notifications/read-all'),
};
