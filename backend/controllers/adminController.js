import User from '../models/User.js';
import Company from '../models/Company.js';
import Application from '../models/Application.js';
import TestAttempt from '../models/TestAttempt.js';
import QuestionBank from '../models/QuestionBank.js';
import { calculatePlacementStats } from '../utils/calculateStats.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

export const getDashboardStats = asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student' });
  const applications = await Application.find().populate('companyId', 'companyName');
  const companies = await Company.countDocuments({ isActive: true });
  const attempts = await TestAttempt.find().populate('studentId', 'name branch').populate('testId', 'title');

  const stats = calculatePlacementStats(students, applications);
  const branchStats = students.reduce((acc, student) => {
    const branch = student.branch || 'Unassigned';
    if (!acc[branch]) acc[branch] = { branch, total: 0, placed: 0 };
    acc[branch].total += 1;
    if (student.isPlaced) acc[branch].placed += 1;
    return acc;
  }, {});

  const companyParticipation = applications.reduce((acc, app) => {
    const name = app.companyId?.companyName || 'Unknown';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const topicDifficulty = {};
  attempts.forEach((attempt) => {
    attempt.topicBreakdown?.forEach((topic) => {
      if (!topicDifficulty[topic.topic]) topicDifficulty[topic.topic] = { topic: topic.topic, correct: 0, total: 0 };
      topicDifficulty[topic.topic].correct += topic.correct;
      topicDifficulty[topic.topic].total += topic.total;
    });
  });

  res.json({
    ...stats,
    activeDrives: companies,
    branchStats: Object.values(branchStats).map((item) => ({
      ...item,
      placementPercentage: item.total ? Math.round((item.placed / item.total) * 100) : 0,
    })),
    companyParticipation: Object.entries(companyParticipation).map(([company, applications]) => ({
      company,
      applications,
    })),
    testReports: {
      attempts: attempts.length,
      averageScore: attempts.length
        ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length)
        : 0,
      mostDifficultTopics: Object.values(topicDifficulty)
        .map((item) => ({
          topic: item.topic,
          accuracy: item.total ? Math.round((item.correct / item.total) * 100) : 0,
        }))
        .sort((a, b) => a.accuracy - b.accuracy)
        .slice(0, 6),
    },
  });
});

export const getStudents = asyncHandler(async (req, res) => {
  const { branch, placed, minCgpa, skill, resume, page = 1, limit = 25 } = req.query;
  const filter = { role: 'student' };

  if (branch) filter.branch = new RegExp(branch, 'i');
  if (placed === 'true') filter.isPlaced = true;
  if (placed === 'false') filter.isPlaced = false;
  if (minCgpa) filter.cgpa = { $gte: Number(minCgpa) };
  if (skill) filter.skills = { $regex: skill, $options: 'i' };
  if (resume === 'available') filter.resumeUrl = { $ne: '' };
  if (resume === 'missing') filter.resumeUrl = '';

  const skip = (Number(page) - 1) * Number(limit);
  const [students, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(filter),
  ]);
  res.json({ students, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 });
});

export const updateStudentPlacement = asyncHandler(async (req, res) => {
  const { isPlaced, placedCompany } = req.body;
  const student = await User.findById(req.params.id);
  if (!student || student.role !== 'student') {
    res.status(404);
    throw new Error('Student not found');
  }

  if (isPlaced !== undefined) student.isPlaced = isPlaced;
  if (placedCompany !== undefined) student.placedCompany = placedCompany;
  await student.save();

  res.json({
    _id: student._id,
    name: student.name,
    isPlaced: student.isPlaced,
    placedCompany: student.placedCompany,
  });
});

export const getAllApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find()
    .populate('studentId', 'name email branch')
    .populate('companyId', 'companyName role package')
    .sort({ updatedAt: -1 });
  res.json(applications);
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const { branch, period = 'all' } = req.query;
  const since = new Date();
  if (period === 'weekly') since.setDate(since.getDate() - 7);
  if (period === 'monthly') since.setMonth(since.getMonth() - 1);

  const match = period === 'all' ? {} : { createdAt: { $gte: since } };
  const attempts = await TestAttempt.find(match)
    .populate('studentId', 'name branch')
    .sort({ score: -1, timeTakenSeconds: 1 });

  const bestByStudent = new Map();
  attempts.forEach((attempt) => {
    if (!attempt.studentId) return;
    if (branch && attempt.studentId.branch !== branch) return;
    const id = attempt.studentId._id.toString();
    const current = bestByStudent.get(id);
    if (!current || attempt.score > current.score) bestByStudent.set(id, attempt);
  });

  res.json(
    [...bestByStudent.values()].slice(0, 20).map((attempt, index) => ({
      rank: index + 1,
      name: attempt.studentId.name,
      branch: attempt.studentId.branch,
      score: attempt.score,
      accuracy: attempt.accuracy,
      badge: index === 0 ? 'Gold' : index === 1 ? 'Silver' : index === 2 ? 'Bronze' : 'Performer',
    }))
  );
});

export const exportStudentsCsv = asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student' }).select('name email branch cgpa backlogs isPlaced placedCompany resumeUrl');
  const rows = [
    ['Name', 'Email', 'Branch', 'CGPA', 'Backlogs', 'Placed', 'Placed Company', 'Resume Available'],
    ...students.map((student) => [
      student.name,
      student.email,
      student.branch,
      student.cgpa,
      student.backlogs,
      student.isPlaced ? 'Yes' : 'No',
      student.placedCompany,
      student.resumeUrl ? 'Yes' : 'No',
    ]),
  ];
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="students-export.csv"');
  res.send(rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n'));
});

export const getActivityLogs = asyncHandler(async (req, res) => {
  const { studentId, page = 1, limit = 50 } = req.query;
  const filter = {};
  if (studentId) filter.studentId = studentId;

  const skip = (Number(page) - 1) * Number(limit);
  const [activities, total] = await Promise.all([
    Activity.find(filter)
      .populate('studentId', 'name email branch')
      .populate('companyId', 'companyName role')
      .populate('testId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Activity.countDocuments(filter),
  ]);

  res.json({ activities, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 });
});
