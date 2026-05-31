import api from '../utils/api';

export const getDashboard = () => api.get('/students/dashboard');
export const getProfile = () => api.get('/students/profile');
export const updateProfile = (data) => api.put('/students/profile', data);
export const uploadResume = (file, role) => {
  const formData = new FormData();
  formData.append('resume', file);
  if (role) formData.append('role', role);
  return api.post('/students/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const analyzeResume = (role) => api.post('/students/resume/analyze', { role });
