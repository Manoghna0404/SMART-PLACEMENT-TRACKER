import express from 'express';
import {
  getApplications,
  getMyApplications,
  getApplicationById,
  submitApplication,
  updateApplicationStatus,
  bulkUpdateApplicationStatus,
  getRoundTracking,
  startRound,
  closeRound,
  promoteRoundStudents,
  deleteApplication,
} from '../controllers/applicationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', protect, getApplications);
router.get('/my', protect, getMyApplications);
router.get('/round-tracking', protect, adminOnly, getRoundTracking);
router.get('/:id', protect, getApplicationById);
router.post('/', protect, submitApplication);
router.put('/bulk-status', protect, adminOnly, bulkUpdateApplicationStatus);
router.put('/rounds/:companyId/start', protect, adminOnly, startRound);
router.put('/rounds/:companyId/close', protect, adminOnly, closeRound);
router.put('/rounds/:companyId/promote', protect, adminOnly, promoteRoundStudents);
router.put('/:id', protect, updateApplicationStatus);
router.delete('/:id', protect, deleteApplication);

export default router;
