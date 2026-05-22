import api from './client';

function toQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const dashboardApi = {
  weekly: (params = {}) => api.get(`/dashboard/weekly${toQuery(params)}`),
  summary: (params = {}) => api.get(`/dashboard/summary${toQuery(params)}`),
};
