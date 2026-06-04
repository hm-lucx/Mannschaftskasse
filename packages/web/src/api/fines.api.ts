import client from './client';

export const finesApi = {
  listCategories: () =>
    client.get('/fines/categories').then((r) => r.data),

  createCategory: (data: any) =>
    client.post('/fines/categories', data).then((r) => r.data),

  updateCategory: (id: string, data: any) =>
    client.put(`/fines/categories/${id}`, data).then((r) => r.data),

  deleteCategory: (id: string) =>
    client.delete(`/fines/categories/${id}`),

  list: (params?: { status?: string }) =>
    client.get('/fines', { params }).then((r) => r.data),

  create: (data: any) =>
    client.post('/fines', data).then((r) => r.data),

  update: (id: string, data: any) =>
    client.put(`/fines/${id}`, data).then((r) => r.data),

  cancel: (id: string) =>
    client.delete(`/fines/${id}`),
};
