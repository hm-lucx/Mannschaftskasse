import client from './client';

export const teamApi = {
  members: () =>
    client.get('/team/members').then((r) => r.data),
};
