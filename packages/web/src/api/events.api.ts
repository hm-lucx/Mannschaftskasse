import client from './client';

export const eventsApi = {
  list: (params?: { from?: string; to?: string; type?: string }) =>
    client.get('/events', { params }).then((r) => r.data),

  get: (id: string) =>
    client.get(`/events/${id}`).then((r) => r.data),

  create: (data: any) =>
    client.post('/events', data).then((r) => r.data),

  update: (id: string, data: any) =>
    client.put(`/events/${id}`, data).then((r) => r.data),

  cancel: (id: string) =>
    client.delete(`/events/${id}`),

  respond: (eventId: string, data: { status: string; decline_reason?: string }) =>
    client.post(`/events/${eventId}/responses`, data).then((r) => r.data),

  getResponses: (eventId: string) =>
    client.get(`/events/${eventId}/responses`).then((r) => r.data),
};
