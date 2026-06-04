import client from './client';

export const reportsApi = {
  attendance: (params?: { from?: string; to?: string }) =>
    client.get('/reports/attendance', { params }).then((r) => r.data),

  fines: (params?: { from?: string; to?: string; categoryId?: string }) =>
    client.get('/reports/fines', { params }).then((r) => r.data),

  exportCsv: (params?: { from?: string; to?: string }) =>
    client.get('/reports/export', { params, responseType: 'blob' }).then((r) => r.data),

  standings: () =>
    client.get('/standings/current').then((r) => r.data),
};
