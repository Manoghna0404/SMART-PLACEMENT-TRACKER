import express from 'express';
import sendEmail from '../utils/sendEmail.js';
import {
  getTests,
  getTestById,
  startTest,
  submitTest,
  getMyTestAttempts,
  getAttemptById,
  getTestAnalytics,
  adminGetTests,
  createTest,
  updateTest,
  deleteTest,
  regenerateTestQuestions,
  getEligibleStudentsForCompany,
  checkQuestionAvailability,
} from '../controllers/testController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly, studentOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();
router.get('/test-email', async (req, res) => {
  try {
    await sendEmail(
      'manoghnalakshmi@gmail.com',
      'SMTP Test Email',
      'Automated email system is working successfully!'
    );

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: 'Email sending failed',
    });
  }
});


// Admin
router.get('/admin/all', protect, adminOnly, adminGetTests);
router.get('/admin/company/:companyId/eligible-students', protect, adminOnly, getEligibleStudentsForCompany);
router.get('/admin/check-availability', protect, adminOnly, checkQuestionAvailability);
router.post('/admin/create', protect, adminOnly, createTest);
router.put('/admin/:id', protect, adminOnly, updateTest);
router.delete('/admin/:id', protect, adminOnly, deleteTest);
router.post('/admin/:id/regenerate', protect, adminOnly, regenerateTestQuestions);

// Student
router.get('/', protect, studentOnly, getTests);
router.get('/analytics', protect, studentOnly, getTestAnalytics);
router.get('/attempts', protect, studentOnly, getMyTestAttempts);
router.get('/attempts/:attemptId', protect, studentOnly, getAttemptById);
router.get('/:id/start', protect, studentOnly, startTest);
router.get('/:id', protect, studentOnly, getTestById);
router.post('/:id/submit', protect, studentOnly, submitTest);
export default router;
