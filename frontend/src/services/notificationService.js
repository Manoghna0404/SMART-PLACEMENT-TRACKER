import api from '../utils/api';

export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.patch('/notifications/read-all');
export const adminCreateNotification = (data) => api.post('/notifications/admin/create', data);
export const getAdminNotifications = () => api.get('/notifications/admin/all');
export const getNotificationReadStatus = (id) => api.get(`/notifications/${id}/read-status`);
