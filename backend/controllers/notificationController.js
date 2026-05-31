import Notification from '../models/Notification.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { notifyAdminAnnouncement } from '../services/notificationService.js';

const visibleFilterFor = (user) => ({
  $or: [
    { recipient: user._id },
    { recipient: null, role: user.role },
    { recipient: null, role: 'all' },
  ],
});

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find(visibleFilterFor(req.user))
    .sort({ createdAt: -1 })
    .limit(30);

  const items = notifications.map((notification) => {
    const obj = notification.toObject();
    obj.isRead = notification.readBy.some((entry) => String(entry.user) === req.user._id.toString());
    return obj;
  });

  res.json({
    notifications: items,
    unreadCount: items.filter((item) => !item.isRead).length,
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    ...visibleFilterFor(req.user),
  });

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  if (!notification.readBy.some((entry) => String(entry.user) === req.user._id.toString())) {
    notification.readBy.push({ user: req.user._id, readAt: new Date() });
    await notification.save();
  }

  res.json({ message: 'Notification marked as read' });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const notifications = await Notification.find(visibleFilterFor(req.user)).select('_id readBy');

  await Promise.all(
    notifications.map((notification) => {
      if (!notification.readBy.some((entry) => String(entry.user) === req.user._id.toString())) {
        notification.readBy.push({ user: req.user._id, readAt: new Date() });
        return notification.save();
      }
      return Promise.resolve();
    })
  );

  res.json({ message: 'All notifications marked as read' });
});

export const createNotificationAdmin = asyncHandler(async (req, res) => {
  const { recipient, role = 'all', title, message, type = 'system', link = '', metadata = {} } = req.body;
  if (!title || !message) {
    res.status(400);
    throw new Error('Title and message are required');
  }

  const notification = await notifyAdminAnnouncement({ recipient, role, title, message, type, link, metadata });
  res.status(201).json(notification);
});

export const getAllNotificationsForAdmin = asyncHandler(async (req, res) => {
  // Admin can view all notifications with read counts
  const notifications = await Notification.find().sort({ createdAt: -1 }).limit(100);
  const items = await Promise.all(
    notifications.map(async (n) => {
      const obj = n.toObject();
      obj.readCount = (n.readBy || []).length;
      return obj;
    })
  );
  res.json({ notifications: items });
});

export const getNotificationReadStatus = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id).populate('readBy.user', 'name email');
  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  const readUsers = (notification.readBy || []).map((entry) => ({
    _id: entry.user?._id,
    name: entry.user?.name,
    email: entry.user?.email,
    readAt: entry.readAt,
  }));

  // Compute recipient count roughly
  let recipientCount = 0;
  if (notification.recipient) recipientCount = 1;
  else if (notification.role === 'all') {
    const User = (await import('../models/User.js')).default;
    recipientCount = await User.countDocuments();
  } else {
    const User = (await import('../models/User.js')).default;
    recipientCount = await User.countDocuments({ role: notification.role });
  }

  res.json({
    notificationId: notification._id,
    title: notification.title,
    message: notification.message,
    readUsers,
    readCount: readUsers.length,
    recipientCount,
    unreadCount: Math.max(0, recipientCount - readUsers.length),
  });
});
