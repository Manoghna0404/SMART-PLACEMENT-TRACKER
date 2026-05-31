import express from 'express';
import {
  getDashboardStats,
  getStudents,
  updateStudentPlacement,
  getAllApplications,
  getLeaderboard,
  exportStudentsCsv,
  getActivityLogs,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/stats', getDashboardStats);
router.get('/students', getStudents);
router.get('/students/export/csv', exportStudentsCsv);
router.put('/students/:id', updateStudentPlacement);
router.get('/applications', getAllApplications);
router.get('/activity', getActivityLogs);
router.get('/leaderboard', getLeaderboard);

export default router;
