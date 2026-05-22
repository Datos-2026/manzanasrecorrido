import api from './client';

function toQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const visitsApi = {
  list: (params = {}) => api.get(`/visits${toQuery(params)}`),
  get: (id) => api.get(`/visits/${id}`),
  create: (data) => api.post('/visits', data),
  update: (id, data) => api.patch(`/visits/${id}`, data),
  remove: (id) => api.delete(`/visits/${id}`),
};
