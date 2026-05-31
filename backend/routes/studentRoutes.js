import express from 'express';
import {
  getStudentProfile,
  updateStudentProfile,
  uploadResume,
  analyzeResume,
  getStudentDashboard,
} from '../controllers/studentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { studentOnly } from '../middleware/roleMiddleware.js';
import { uploadResume as uploadMiddleware } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.use(protect, studentOnly);

router.get('/dashboard', getStudentDashboard);
router.get('/profile', getStudentProfile);
router.put('/profile', updateStudentProfile);
router.post('/resume', uploadMiddleware.single('resume'), uploadResume);
router.post('/resume/analyze', analyzeResume);

export default router;
