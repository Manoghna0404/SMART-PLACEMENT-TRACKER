import express from 'express';
import {
  getExperiences,
  createExperience,
  deleteExperience,
} from '../controllers/interviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import { studentOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', protect, getExperiences);
router.post('/', protect, studentOnly, createExperience);
router.delete('/:id', protect, deleteExperience);

export default router;
