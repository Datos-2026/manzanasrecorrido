import api from './client';

function toQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const assignmentsApi = {
  list: (params = {}) => api.get(`/assignments${toQuery(params)}`),
  myBlocks: () => api.get('/assignments/my-blocks'),
  create: (data) => api.post('/assignments', data),
  update: (id, data) => api.patch(`/assignments/${id}`, data),
  remove: (id) => api.delete(`/assignments/${id}`),
};
