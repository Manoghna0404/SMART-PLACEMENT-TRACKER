import api from '../utils/api';

// Student
export const getTests = () => api.get('/tests');
export const startTest = (id) => api.get(`/tests/${id}/start`);
export const submitTest = (id, payload) => api.post(`/tests/${id}/submit`, payload);
export const getTestAttempts = () => api.get('/tests/attempts');
export const getAttemptById = (attemptId) => api.get(`/tests/attempts/${attemptId}`);
export const getTestAnalytics = () => api.get('/tests/analytics');

// Admin
export const adminGetTests = () => api.get('/tests/admin/all');
export const adminCreateTest = (data) => api.post('/tests/admin/create', data);
export const adminUpdateTest = (id, data) => api.put(`/tests/admin/${id}`, data);
export const adminActivateTest = (id) => api.put(`/tests/admin/${id}`, { isActive: true });
export const adminDeactivateTest = (id) => api.delete(`/tests/admin/${id}`);
export const adminDeleteTest = (id) => api.delete(`/tests/admin/${id}`);
export const adminRegenerateTest = (id) => api.post(`/tests/admin/${id}/regenerate`);
export const getEligibleStudentsForCompany = (companyId) => api.get(`/tests/admin/company/${companyId}/eligible-students`);
export const checkQuestionAvailability = (params) => api.get('/tests/admin/check-availability', { params });
