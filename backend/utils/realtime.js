import Notification from '../models/Notification.js';

let ioInstance = null;

export const initRealtime = (io) => {
  ioInstance = io;
};

export const emitToUser = (userId, event, payload) => {
  if (!ioInstance || !userId) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
};

export const emitToRole = (role, event, payload) => {
  if (!ioInstance || !role) return;
  ioInstance.to(`role:${role}`).emit(event, payload);
};

export const createNotification = async ({
  recipient = null,
  role = 'all',
  title,
  message,
  type = 'system',
  link = '',
  metadata = {},
}) => {
  const notification = await Notification.create({
    recipient,
    role,
    title,
    message,
    type,
    link,
    metadata,
  });

  const payload = notification.toObject();
  if (recipient) emitToUser(recipient.toString(), 'notification:new', payload);
  else if (role && role !== 'all') emitToRole(role, 'notification:new', payload);
  else if (ioInstance) ioInstance.emit('notification:new', payload);

  return notification;
};
