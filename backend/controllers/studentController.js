import User from '../models/User.js';
import Application from '../models/Application.js';
import TestAttempt from '../models/TestAttempt.js';
import Activity from '../models/Activity.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractTextFromPdf, analyzeResumeWithAI } from '../utils/resumeAnalyzer.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { notifyResumeStatusUpdate } from '../services/notificationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..');

export const getStudentProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
});

export const updateStudentProfile = asyncHandler(async (req, res) => {
  const { name, cgpa, branch, backlogs, skills } = req.body;
  const user = await User.findById(req.user._id);

  if (name) user.name = name;
  if (cgpa !== undefined) user.cgpa = cgpa;
  if (branch) user.branch = branch;
  if (backlogs !== undefined) user.backlogs = backlogs;
  if (skills) {
    user.skills = Array.isArray(skills) ? skills : skills.split(',').map((s) => s.trim());
  }

  await user.save();
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    cgpa: user.cgpa,
    branch: user.branch,
    backlogs: user.backlogs,
    skills: user.skills,
    resumeUrl: user.resumeUrl,
    resumeScore: user.resumeScore,
    resumeAnalysis: user.resumeAnalysis,
    isPlaced: user.isPlaced,
  });
});

export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a PDF resume');
  }

  const role = req.body.role || 'Software Engineer';
  const resumeUrl = `/uploads/resumes/${req.file.filename}`;
  const text = await extractTextFromPdf(req.file.path);
  const analysis = await analyzeResumeWithAI(text, req.user.skills || [], role);

  const user = await User.findById(req.user._id);
  user.resumeUrl = resumeUrl;
  user.resumeScore = analysis.score;
  user.resumeAnalysis = analysis;
  user.resumeStatus = 'Analyzed';
  user.resumeHistory.push({
    url: resumeUrl,
    originalName: req.file.originalname,
    size: req.file.size,
    score: analysis.score,
  });
  await user.save();

  await Activity.create({
    studentId: req.user._id,
    type: 'resume',
    title: 'Resume uploaded and analyzed',
    description: `Resume score ${analysis.score}/100 for ${role}`,
    status: 'Analyzed',
  });

  await notifyResumeStatusUpdate(user);

  res.json({
    resumeUrl: user.resumeUrl,
    resumeScore: user.resumeScore,
    resumeAnalysis: user.resumeAnalysis,
    resumeStatus: user.resumeStatus,
    resumeHistory: user.resumeHistory,
  });
});

export const analyzeResume = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user.resumeUrl) {
    res.status(400);
    throw new Error('Please upload a resume first');
  }

  const role = req.body.role || 'Software Engineer';
  const filePath = path.join(backendRoot, user.resumeUrl.replace(/^\/+/, ''));
  const text = await extractTextFromPdf(filePath);
  const analysis = await analyzeResumeWithAI(text, user.skills || [], role);

  user.resumeScore = analysis.score;
  user.resumeAnalysis = analysis;
  user.resumeStatus = 'Analyzed';
  await user.save();

  res.json({ resumeScore: analysis.score, resumeAnalysis: analysis });
});

export const getStudentDashboard = asyncHandler(async (req, res) => {
  const applications = await Application.find({ studentId: req.user._id })
    .populate('companyId', 'companyName role package')
    .sort({ updatedAt: -1 })
    .limit(5);

  const testAttempts = await TestAttempt.find({ studentId: req.user._id })
    .populate('testId', 'title')
    .sort({ createdAt: -1 })
    .limit(5);

  const allAttempts = await TestAttempt.find({ studentId: req.user._id })
    .populate('testId', 'title')
    .sort({ createdAt: 1 });

  const activities = await Activity.find({ studentId: req.user._id })
    .populate('companyId', 'companyName')
    .populate('testId', 'title')
    .sort({ createdAt: -1 })
    .limit(8);

  const statusBreakdown = {};
  const allApps = await Application.find({ studentId: req.user._id });
  allApps.forEach((app) => {
    statusBreakdown[app.status] = (statusBreakdown[app.status] || 0) + 1;
  });

  const averageScore = allAttempts.length
    ? Math.round(allAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / allAttempts.length)
    : 0;
  const readiness = Math.min(
    100,
    Math.round(
      (req.user.cgpa >= 7 ? 25 : req.user.cgpa >= 6 ? 15 : 5) +
        (req.user.resumeScore ? Math.min(25, req.user.resumeScore / 4) : 0) +
        Math.min(25, averageScore / 4) +
        Math.min(25, allApps.length * 5)
    )
  );

  const topicStrength = {};
  allAttempts.forEach((attempt) => {
    attempt.topicBreakdown?.forEach((topic) => {
      if (!topicStrength[topic.topic]) topicStrength[topic.topic] = { correct: 0, total: 0 };
      topicStrength[topic.topic].correct += topic.correct;
      topicStrength[topic.topic].total += topic.total;
    });
  });

  res.json({
    user: {
      name: req.user.name,
      cgpa: req.user.cgpa,
      branch: req.user.branch,
      resumeScore: req.user.resumeScore,
      resumeStatus: req.user.resumeStatus,
      isPlaced: req.user.isPlaced,
    },
    recentApplications: applications,
    recentTests: testAttempts,
    activities,
    analytics: {
      readiness,
      averageScore,
      performanceTrend: allAttempts.map((attempt, index) => ({
        name: attempt.testId?.title || `Test ${index + 1}`,
        score: attempt.score,
        accuracy: attempt.accuracy || attempt.score,
      })),
      topicBreakdown: Object.entries(topicStrength).map(([topic, data]) => ({
        topic,
        score: data.total ? Math.round((data.correct / data.total) * 100) : 0,
        correct: data.correct,
        total: data.total,
      })),
    },
    statusBreakdown,
    totalApplications: allApps.length,
  });
});
