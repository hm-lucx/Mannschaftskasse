import client from './client';

export const paymentsApi = {
  list: () =>
    client.get('/payments').then((r) => r.data),

  create: (data: any) =>
    client.post('/payments', data).then((r) => r.data),

  getLedger: () =>
    client.get('/payments/ledger').then((r) => r.data),

  createLedgerEntry: (data: any) =>
    client.post('/payments/ledger', data).then((r) => r.data),
};
