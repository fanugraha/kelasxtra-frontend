import api from '../lib/axios';

export const notificationService = {
  list: () => api.get('/notifications').then((res) => res.data),
  unreadCount: () => api.get('/notifications/unread-count').then((res) => res.data),
  markAsRead: (id) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
};
