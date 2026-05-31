import api from '../utils/api';

export const getExperiences = (params) => api.get('/interviews', { params });
export const createExperience = (data) => api.post('/interviews', data);
export const deleteExperience = (id) => api.delete(`/interviews/${id}`);
export const getInterviewSchedules = (params) => api.get('/interviews/schedules', { params });
export const createInterviewSchedule = (data) => api.post('/interviews/schedules', data);
export const updateInterviewSchedule = (id, data) => api.put(`/interviews/schedules/${id}`, data);
export const cancelInterviewSchedule = (id) => api.delete(`/interviews/schedules/${id}`);
