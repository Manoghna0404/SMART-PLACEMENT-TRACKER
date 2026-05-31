import api from '../utils/api';

export const getCompanies = () => api.get('/companies');
export const getEligibleCompanies = () => api.get('/companies/eligible');
export const addCompany = (data) => api.post('/companies', data);
export const updateCompany = (id, data) => api.put(`/companies/${id}`, data);
export const deleteCompany = (id) => api.delete(`/companies/${id}`);
