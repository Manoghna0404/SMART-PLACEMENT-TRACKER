import api from '../utils/api';

export const getQuestions = (params) => api.get('/question-bank', { params });
export const getQuestionMeta = () => api.get('/question-bank/meta');
export const getBankSets = () => api.get('/question-bank/sets');
export const updateBankSet = (key, updates) => api.put(`/question-bank/sets/${key}`, updates);
export const createQuestion = (data) => api.post('/question-bank', data);
export const deleteQuestion = (id) => api.delete(`/question-bank/${id}`);
export const uploadQuestions = (file, set = 'set1', topicName = '') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('topicName', topicName);
  return api.post(`/question-bank/upload?set=${set}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const downloadTemplate = () =>
  api.get('/question-bank/template', { responseType: 'blob' });
