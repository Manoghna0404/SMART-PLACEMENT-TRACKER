import express from 'express';
import {
  getCompanies,
  getCompanyById,
  addCompany,
  updateCompany,
  deleteCompany,
  getEligibleCompanies,
} from '../controllers/companyController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly, studentOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', protect, getCompanies);
router.get('/eligible', protect, studentOnly, getEligibleCompanies);
router.get('/:id', protect, getCompanyById);
router.post('/', protect, adminOnly, addCompany);
router.put('/:id', protect, adminOnly, updateCompany);
router.delete('/:id', protect, adminOnly, deleteCompany);

export default router;
