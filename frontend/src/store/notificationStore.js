import { create } from 'zustand';
import { io } from 'socket.io-client';
import api from '../utils/api';

const socketUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api').replace('/api', '');

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  socket: null,
  loadNotifications: async () => {
    const { data } = await api.get('/notifications');
    set({ notifications: data.notifications || [], unreadCount: data.unreadCount || 0 });
  },
  connectSocket: (token) => {
    if (!token || get().socket) return;
    const socket = io(socketUrl, { auth: { token }, transports: ['polling', 'websocket'] });
    socket.on('notification:new', (notification) => {
      set((state) => ({
        notifications: [{ ...notification, isRead: false }, ...state.notifications].slice(0, 30),
        unreadCount: state.unreadCount + 1,
      }));
    });
    set({ socket });
  },
  disconnectSocket: () => {
    get().socket?.disconnect();
    set({ socket: null });
  },
  markRead: async (id) => {
    await api.patch(`/notifications/${id}/read`);
    set((state) => ({
      notifications: state.notifications.map((item) => (item._id === id ? { ...item, isRead: true } : item)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },
  markAllRead: async () => {
    await api.patch('/notifications/read-all');
    set((state) => ({
      notifications: state.notifications.map((item) => ({ ...item, isRead: true })),
      unreadCount: 0,
    }));
  },
}));

export default useNotificationStore;
