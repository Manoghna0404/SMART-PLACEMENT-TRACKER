import InterviewExperience from '../models/InterviewExperience.js';
import InterviewSchedule from '../models/InterviewSchedule.js';
import Application from '../models/Application.js';

import { asyncHandler } from '../middleware/errorMiddleware.js';
import { createNotification } from '../utils/realtime.js';
import { notifyInterviewScheduled } from '../services/notificationService.js';

export const getExperiences = asyncHandler(async (req, res) => {
  const { company, difficulty } = req.query;
  const filter = {};
  if (company) filter.companyName = new RegExp(company, 'i');
  if (difficulty) filter.difficulty = difficulty;

  const experiences = await InterviewExperience.find(filter)
    .populate('studentId', 'name branch')
    .sort({ createdAt: -1 });
  res.json(experiences);
});

export const createExperience = asyncHandler(async (req, res) => {
  const experience = await InterviewExperience.create({
    ...req.body,
    studentId: req.user._id,
    studentName: req.user.name,
    questions: req.body.questions
      ? Array.isArray(req.body.questions)
        ? req.body.questions
        : req.body.questions.split('\n').filter(Boolean)
      : [],
  });
  res.status(201).json(experience);
});

export const deleteExperience = asyncHandler(async (req, res) => {
  const experience = await InterviewExperience.findById(req.params.id);
  if (!experience) {
    res.status(404);
    throw new Error('Experience not found');
  }
  if (
    experience.studentId.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized');
  }
  await experience.deleteOne();
  res.json({ message: 'Experience removed' });
});

const getStatusForRound = (roundType) => {
  switch (roundType) {
    case 'Aptitude':
      return 'Aptitude Round';
    case 'Technical':
      return 'Technical Interview Round 1';
    case 'HR':
      return 'HR Interview';
    default:
      return roundType || 'Interview Scheduled';
  }
};

const getPipelineStageName = (roundName, roundType) => {
  if (roundName) return roundName;
  return getStatusForRound(roundType);
};

const updatePipelineStage = (application, stageName, updates = {}) => {
  if (!stageName || !Array.isArray(application.pipelineStages)) return;
  const stageIndex = application.pipelineStages.findIndex((stage) => stage.name === stageName);
  if (stageIndex < 0) return;

  application.pipelineStages[stageIndex] = {
    ...application.pipelineStages[stageIndex].toObject?.() || application.pipelineStages[stageIndex],
    ...updates,
    updatedAt: new Date(),
  };
};

export const getSchedules = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { studentId: req.user._id };
  if (req.query.companyId) filter.companyId = req.query.companyId;
  if (req.query.status) filter.status = req.query.status;
  const schedules = await InterviewSchedule.find(filter)
    .populate('studentId', 'name email branch')
    .populate('companyId', 'companyName role')
    .populate('applicationId', 'status currentRound')
    .sort({ scheduledAt: 1 });
  res.json(schedules);
});

export const createSchedule = asyncHandler(async (req, res) => {
  let application = null;
  if (req.body.applicationId) {
    application = await Application.findById(req.body.applicationId).populate('companyId', 'companyName role');
  } else if (req.body.studentEmail) {
    application = await Application.findOne({ studentEmail: req.body.studentEmail }).populate('companyId', 'companyName role');
  }

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  const schedule = await InterviewSchedule.create({
    applicationId: application._id,
    studentId: application.studentId,
    companyId: application.companyId,
    roundName: req.body.roundName,
    roundType: req.body.roundType,
    scheduledAt: req.body.scheduledAt,
    mode: req.body.mode,
    meetingLink: req.body.meetingLink,
    location: req.body.location,
    interviewer: req.body.interviewer,
    notes: req.body.notes,
    createdBy: req.user._id,
  });

  const stageName = getPipelineStageName(req.body.roundName, req.body.roundType);
  application.status = stageName;
  application.currentRound = stageName;
  application.currentStage = stageName;
  application.interviewDate = schedule.scheduledAt;
  application.interviewMode = schedule.mode;
  application.meetingLink = schedule.meetingLink;
  application.location = schedule.location;
  updatePipelineStage(application, stageName, {
    status: 'Scheduled',
    scheduledAt: schedule.scheduledAt,
    mode: schedule.mode,
    meetingLink: schedule.meetingLink,
    location: schedule.location,
    interviewer: schedule.interviewer,
    notes: schedule.notes || '',
  });
  await application.save();

  await notifyInterviewScheduled(schedule, application);


  const populated = await InterviewSchedule.findById(schedule._id)
    .populate('studentId', 'name email branch')
    .populate('companyId', 'companyName role')
    .populate('applicationId', 'status currentRound');
  res.status(201).json(populated);
});

export const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await InterviewSchedule.findById(req.params.id);
  if (!schedule) {
    res.status(404);
    throw new Error('Interview schedule not found');
  }

  const application = await Application.findById(schedule.applicationId).populate('companyId', 'companyName role');
  if (!application) {
    res.status(404);
    throw new Error('Associated application not found');
  }

  const { roundName, roundType, scheduledAt, mode, meetingLink, location, interviewer, notes, status } = req.body;
  if (roundName) schedule.roundName = roundName;
  if (roundType) schedule.roundType = roundType;
  if (scheduledAt) schedule.scheduledAt = scheduledAt;
  if (mode) schedule.mode = mode;
  if (meetingLink !== undefined) schedule.meetingLink = meetingLink;
  if (location !== undefined) schedule.location = location;
  if (interviewer !== undefined) schedule.interviewer = interviewer;
  if (notes !== undefined) schedule.notes = notes;
  if (status) schedule.status = status;

  await schedule.save();

  const stageName = getPipelineStageName(schedule.roundName, schedule.roundType);
  application.status = stageName;
  application.currentRound = stageName;
  application.currentStage = stageName;
  application.interviewDate = schedule.scheduledAt;
  application.interviewMode = schedule.mode;
  application.meetingLink = schedule.meetingLink;
  application.location = schedule.location;
  updatePipelineStage(application, stageName, {
    status: status === 'Cancelled' ? 'Cancelled' : 'Scheduled',
    scheduledAt: schedule.scheduledAt,
    mode: schedule.mode,
    meetingLink: schedule.meetingLink,
    location: schedule.location,
    interviewer: schedule.interviewer,
    notes: schedule.notes || '',
  });
  await application.save();

  await notifyInterviewScheduled(schedule, application);


  const populated = await InterviewSchedule.findById(schedule._id)
    .populate('studentId', 'name email branch')
    .populate('companyId', 'companyName role')
    .populate('applicationId', 'status currentRound');
  res.json(populated);
});

export const cancelSchedule = asyncHandler(async (req, res) => {
  const schedule = await InterviewSchedule.findById(req.params.id);
  if (!schedule) {
    res.status(404);
    throw new Error('Interview schedule not found');
  }

  schedule.status = 'Cancelled';
  await schedule.save();

  const application = await Application.findById(schedule.applicationId).populate('companyId', 'companyName role');
  if (application) {
    const stageName = getPipelineStageName(schedule.roundName, schedule.roundType);
    application.status = stageName;
    application.currentRound = stageName;
    application.currentStage = stageName;
    application.notes = `Interview cancelled for ${schedule.roundName}`;
    updatePipelineStage(application, stageName, {
      status: 'Cancelled',
      notes: application.notes,
    });
    await application.save();
  }

  await notifyInterviewScheduled(schedule, application);


  res.json({ message: 'Interview schedule cancelled', schedule });
});
