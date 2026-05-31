import api from '../utils/api';

export const getMyApplications = () => api.get('/applications/my');
export const getAllApplications = () => api.get('/applications');
export const applyToCompany = (companyId) => api.post('/applications', { companyId });
export const updateApplication = (id, data) => api.put(`/applications/${id}`, data);
export const getRoundTracking = (params) => api.get('/applications/round-tracking', { params });
export const startRound = (companyId, data) => api.put(`/applications/rounds/${companyId}/start`, data);
export const closeRound = (companyId, data) => api.put(`/applications/rounds/${companyId}/close`, data);
export const promoteRoundStudents = (companyId, data) => api.put(`/applications/rounds/${companyId}/promote`, data);
export const deleteApplication = (id) => api.delete(`/applications/${id}`);
