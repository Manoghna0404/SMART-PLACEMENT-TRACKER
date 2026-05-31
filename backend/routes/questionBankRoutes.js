import express from 'express';
import {
  getQuestions,
  getQuestionMeta,
  getBankSets,
  updateBankSet,
  createQuestion,
  uploadQuestions,
  deleteQuestion,
  downloadTemplate,
} from '../controllers/questionBankController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';
import { uploadQuestions as uploadMiddleware } from '../middleware/uploadCsvMiddleware.js';

const router = express.Router();

router.get('/template', protect, adminOnly, downloadTemplate);
router.get('/meta', protect, adminOnly, getQuestionMeta);
router.get('/sets', protect, adminOnly, getBankSets);
router.put('/sets/:key', protect, adminOnly, updateBankSet);
router.get('/', protect, adminOnly, getQuestions);
router.post('/', protect, adminOnly, createQuestion);
router.post('/upload', protect, adminOnly, uploadMiddleware.single('file'), uploadQuestions);
router.delete('/:id', protect, adminOnly, deleteQuestion);

export default router;
