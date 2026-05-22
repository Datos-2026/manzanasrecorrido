import api from './client';

export const communesApi = {
  list: () => api.get('/communes'),
  get: (id) => api.get(`/communes/${id}`),
  create: (data) => api.post('/communes', data),
  update: (id, data) => api.patch(`/communes/${id}`, data),
  remove: (id) => api.delete(`/communes/${id}`),
};
