import api from '../utils/api';

export const getStats = () => api.get('/admin/stats');
export const getStudents = (params) => api.get('/admin/students', { params });
export const updateStudentPlacement = (id, data) => api.put(`/admin/students/${id}`, data);
export const getAdminApplications = (params) => api.get('/admin/applications', { params });
export const updateApplicationStatus = (id, data) => api.put(`/applications/${id}`, data);
export const getActivityLogs = (params) => api.get('/admin/activity', { params });
export const getLeaderboard = (params) => api.get('/admin/leaderboard', { params });
export const exportStudentsCsv = () => api.get('/admin/students/export/csv', { responseType: 'blob' });
