import express from 'express';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  // admin APIs
  createNotificationAdmin,
  getAllNotificationsForAdmin,
  getNotificationReadStatus,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/', getNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

// Admin endpoints
router.post('/admin/create', adminOnly, createNotificationAdmin);
router.get('/admin/all', adminOnly, getAllNotificationsForAdmin);
router.get('/:id/read-status', adminOnly, getNotificationReadStatus);

export default router;
