import api from './client';

function toQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const blocksApi = {
  list: (params = {}) => api.get(`/blocks${toQuery(params)}`),
  get: (id) => api.get(`/blocks/${id}`),
  create: (data) => api.post('/blocks', data),
  update: (id, data) => api.patch(`/blocks/${id}`, data),
  remove: (id) => api.delete(`/blocks/${id}`),
};
