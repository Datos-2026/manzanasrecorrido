import api from './client';

function toQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.set(k, v);
  });
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const surveyRoundsApi = {
  list: (params = {}) => api.get(`/survey-rounds${toQuery(params)}`),
  get: (id) => api.get(`/survey-rounds/${id}`),
  active: (blockId) => api.get(`/survey-rounds/active${toQuery({ blockId })}`),
  start: (data) => api.post('/survey-rounds', data),
  close: (id, data = {}) => api.patch(`/survey-rounds/${id}/close`, data),
};
