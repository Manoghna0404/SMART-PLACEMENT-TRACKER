import Application from '../models/Application.js';
import Company from '../models/Company.js';

import User from '../models/User.js';
import { checkEligibility } from '../utils/eligibilityChecker.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { notifyApplicationStatusUpdate } from '../services/notificationService.js';
import { createNotification, emitToRole, emitToUser } from '../utils/realtime.js';

const PIPELINE_STAGES = [
  { name: 'Applied', type: 'Application', sequence: 1, status: 'Completed', notes: 'Application submitted' },
  { name: 'Round 1', type: 'Aptitude', sequence: 2, status: 'Pending', notes: 'Round 1 pending' },
  { name: 'Round 2', type: 'Technical', sequence: 3, status: 'Pending', notes: 'Round 2 pending' },
  { name: 'HR Round', type: 'HR', sequence: 4, status: 'Pending', notes: 'HR round pending' },
  { name: 'Offer Released', type: 'Offer', sequence: 5, status: 'Pending', notes: 'Offer release pending' },
];

const buildProgress = (status) => {
  if (['Selected', 'Rejected', 'Offer Released'].includes(status)) return 100;
  if (status === 'Applied') return 10;
  const match = String(status || '').match(/Round\s+(\d+)/i);
  return match ? Math.min(90, 20 + Number(match[1]) * 20) : 50;
};

const normalizeCompanyRounds = (company) => {
  const configured = Array.isArray(company?.rounds) && company.rounds.length ? company.rounds : PIPELINE_STAGES;
  const rounds = configured
    .map((round, index) => ({
      name: round.name || `Round ${index + 1}`,
      type: round.type || 'Other',
      sequence: Number(round.sequence || index + 1),
      passingCriteria: round.passingCriteria || '',
      scheduledAt: round.scheduledAt || null,
      mode: round.mode || 'Online',
      meetingLink: round.meetingLink || '',
      location: round.location || '',
      driveStatus: round.status || 'Draft',
    }))
    .sort((a, b) => a.sequence - b.sequence);

  if (!rounds.some((round) => round.name === 'Applied')) {
    rounds.unshift({ name: 'Applied', type: 'Application', sequence: 0, passingCriteria: '', scheduledAt: null, mode: 'Online', meetingLink: '', location: '', driveStatus: 'Open' });
  }

  return rounds;
};

const getDefaultPipelineStages = (company) =>
  normalizeCompanyRounds(company).map((stage, index) => ({
    name: stage.name,
    status: index === 0 ? 'Completed' : 'Pending',
    scheduledAt: null,
    mode: stage.mode || 'Online',
    meetingLink: stage.meetingLink || '',
    location: stage.location || '',
    interviewer: '',
    notes: index === 0 ? 'Application submitted' : stage.passingCriteria || `${stage.name} pending`,
    feedback: '',
    updatedAt: new Date(),
  }));

const findNextPendingStage = (stages) => stages.find((stage) => stage.status === 'Pending');
const getStageIndex = (application, stageName) => application.pipelineStages.findIndex((stage) => stage.name === stageName);
const stageToStatus = (stageName, state) => {
  if (stageName === 'Applied') return 'Applied';
  if (stageName === 'Offer Released') return 'Offer Released';
  if (stageName === 'HR Round' || /hr/i.test(stageName)) return state === 'Completed' ? 'HR Round Completed' : 'HR Round';
  return `${stageName} ${state}`;
};

const addStatusHistory = (application, { status, currentRound, notes, changedBy }) => {
  application.statusHistory = application.statusHistory || [];
  application.statusHistory.push({
    status: status || application.status,
    round: currentRound || application.currentRound || 'Application Screening',
    notes: notes || '',
    changedBy,
    timestamp: new Date(),
  });
  application.progress = buildProgress(status || application.status);
};

const updatePipelineStage = (application, stageName, updates = {}) => {
  if (!stageName) return;
  const stageIndex = application.pipelineStages.findIndex((stage) => stage.name === stageName);
  if (stageIndex === -1) return;

  application.pipelineStages[stageIndex] = {
    ...(application.pipelineStages[stageIndex].toObject?.() || application.pipelineStages[stageIndex]),
    ...updates,
    updatedAt: new Date(),
  };

  const nextStage = findNextPendingStage(application.pipelineStages);
  if (nextStage) {
    application.currentStage = nextStage.name;
    application.currentRound = nextStage.name;
    application.currentStageIndex = application.pipelineStages.indexOf(nextStage);
  }
};

const emitApplicationUpdate = (application) => {
  emitToRole('admin', 'application:updated', application);
  emitToUser(application.studentId?._id || application.studentId, 'application:updated', application);
};

const getNextStage = (application, stageName) => {
  const index = getStageIndex(application, stageName);
  return index >= 0 ? application.pipelineStages[index + 1] : null;
};

const saveRoundAction = async ({ application, roundName, action, changedBy, notes = '', schedule = {} }) => {
  const stageIndex = getStageIndex(application, roundName);
  if (stageIndex < 0) return application;
  const stage = application.pipelineStages[stageIndex];

  if (action === 'start') {
    updatePipelineStage(application, roundName, {
      status: 'Scheduled',
      scheduledAt: schedule.scheduledAt || stage.scheduledAt,
      mode: schedule.mode || stage.mode,
      meetingLink: schedule.meetingLink ?? stage.meetingLink,
      location: schedule.location ?? stage.location,
      notes: notes || `${roundName} started`,
    });
    application.status = stageToStatus(roundName, 'In Progress');
    application.roundStatus = 'In Progress';
  }

  if (action === 'complete') {
    updatePipelineStage(application, roundName, { status: 'Completed', notes: notes || `${roundName} completed` });
    application.status = stageToStatus(roundName, 'Completed');
    application.roundStatus = 'Completed';
  }

  if (action === 'promote') {
    updatePipelineStage(application, roundName, { status: 'Completed', notes: notes || `${roundName} qualified` });
    const nextStage = getNextStage(application, roundName);
    if (nextStage) {
      updatePipelineStage(application, nextStage.name, {
        status: 'Scheduled',
        scheduledAt: schedule.scheduledAt || nextStage.scheduledAt,
        mode: schedule.mode || nextStage.mode,
        meetingLink: schedule.meetingLink ?? nextStage.meetingLink,
        location: schedule.location ?? nextStage.location,
        notes: notes || `Shortlisted for ${nextStage.name}`,
      });
      application.currentRound = nextStage.name;
      application.currentStage = nextStage.name;
      application.currentStageIndex = getStageIndex(application, nextStage.name);
      application.status = nextStage.name === 'Offer Released' ? 'Offer Released' : `Shortlisted for ${nextStage.name}`;
      application.roundStatus = nextStage.name === 'Offer Released' ? 'Offer Released' : 'Shortlisted';
    } else {
      application.status = 'Selected';
      application.roundStatus = 'Selected';
      application.currentRound = 'Selected';
      application.currentStage = 'Selected';
    }
  }

  if (action === 'reject') {
    updatePipelineStage(application, roundName, { status: 'Rejected', notes: notes || `Rejected in ${roundName}` });
    application.status = 'Rejected';
    application.roundStatus = 'Rejected';
    application.currentRound = roundName;
    application.currentStage = roundName;
  }

  addStatusHistory(application, {
    status: application.status,
    currentRound: application.currentRound,
    notes,
    changedBy,
  });
  application.progress = buildProgress(application.status);
  await application.save();
  emitApplicationUpdate(application);
  return application;
};

export const getApplications = asyncHandler(async (req, res) => {
  const { status, company, branch, page = 1, limit = 25 } = req.query;
  const filter = req.user.role === 'admin' ? {} : { studentId: req.user._id };

  if (status) filter.status = status;

  if (company) {
    const companies = await Company.find({ companyName: new RegExp(company, 'i') }).select('_id');
    filter.companyId = { $in: companies.map((item) => item._id) };
  }

  if (branch) {
    const students = await User.find({ branch: new RegExp(branch, 'i'), role: 'student' }).select('_id');
    filter.studentId = { $in: students.map((item) => item._id) };
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('studentId', 'name email branch cgpa')
      .populate('companyId', 'companyName role package deadline')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Application.countDocuments(filter),
  ]);

  res.json({ applications, total, page: Number(page), pages: Math.ceil(total / Number(limit)) || 1 });
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ studentId: req.user._id })
    .populate('companyId', 'companyName role package deadline')
    .sort({ appliedDate: -1 });
  res.json(applications);
});

export const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('studentId', 'name email branch cgpa')
    .populate('companyId', 'companyName role package deadline');
  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }
  if (req.user.role !== 'admin' && application.studentId._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }
  res.json(application);
});

export const submitApplication = asyncHandler(async (req, res) => {
  const { companyId } = req.body;
  const company = await Company.findById(companyId);
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }

  const { eligible, reasonList = [] } = checkEligibility(req.user, company);
  if (!eligible) {
    res.status(400);
    throw new Error(reasonList.join(', ') || 'You are not eligible for this company');
  }

  const existing = await Application.findOne({ studentId: req.user._id, companyId });
  if (existing) {
    res.status(400);
    throw new Error('Already applied to this company');
  }

  const pipelineStages = getDefaultPipelineStages(company);
  const firstPending = pipelineStages.find((stage) => stage.status === 'Pending') || pipelineStages[0];
  const application = await Application.create({
    studentId: req.user._id,
    studentEmail: req.user.email,
    companyId,
    status: 'Applied',
    roundStatus: 'Applied',
    currentRound: firstPending.name,
    currentStage: firstPending.name,
    currentStageIndex: pipelineStages.findIndex((stage) => stage.name === firstPending.name),
    pipelineStages,
    progress: buildProgress('Applied'),
    statusHistory: [
      {
        status: 'Applied',
        round: 'Application Submitted',
        notes: 'Application submitted',
        changedBy: req.user._id,
      },
    ],
  });

  // Activity logs disabled as per requirements

  await createNotification({

    role: 'admin',
    type: 'application',
    title: 'New student application',
    message: `${req.user.name} applied to ${company.companyName}`,
    link: '/admin/students',
    metadata: { companyId, studentId: req.user._id },
  });

  const populated = await application.populate('companyId', 'companyName role package deadline');
  res.status(201).json(populated);
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const {
    status,
    stageName,
    stageStatus,
    interviewDate,
    interviewMode,
    meetingLink,
    location,
    interviewer,
    feedback,
    notes,
    currentRound,
    adminNotes,
  } = req.body;
  const application = await Application.findById(req.params.id);
  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  if (!Array.isArray(application.pipelineStages)) {
    application.pipelineStages = getDefaultPipelineStages();
  }

  const isAdminChange =
    status || stageName || stageStatus || interviewDate || interviewMode || meetingLink || location || interviewer || feedback || adminNotes;
  if (isAdminChange && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required to update application workflow');
  }

  if (status) {
    application.status = status;
  }

  if (stageName) {
    if (status) {
      application.status = status;
    } else {
      application.status = stageName;
    }
    application.currentRound = stageName;
    application.currentStage = stageName;
    updatePipelineStage(application, stageName, {
      status: stageStatus || (status === stageName ? 'Completed' : application.pipelineStages.find((stage) => stage.name === stageName)?.status || 'Pending'),
      scheduledAt: interviewDate || application.pipelineStages.find((stage) => stage.name === stageName)?.scheduledAt,
      mode: interviewMode || application.pipelineStages.find((stage) => stage.name === stageName)?.mode,
      meetingLink: meetingLink !== undefined ? meetingLink : application.pipelineStages.find((stage) => stage.name === stageName)?.meetingLink,
      location: location !== undefined ? location : application.pipelineStages.find((stage) => stage.name === stageName)?.location,
      interviewer: interviewer !== undefined ? interviewer : application.pipelineStages.find((stage) => stage.name === stageName)?.interviewer,
      feedback: feedback !== undefined ? feedback : application.pipelineStages.find((stage) => stage.name === stageName)?.feedback,
      notes: notes || adminNotes || application.pipelineStages.find((stage) => stage.name === stageName)?.notes,
    });
  }

  if (interviewDate) application.interviewDate = interviewDate;
  if (interviewMode) application.interviewMode = interviewMode;
  if (meetingLink !== undefined) application.meetingLink = meetingLink;
  if (location !== undefined) application.location = location;

  if (notes !== undefined) {
    application.notes = notes;
  }
  if (adminNotes !== undefined) {
    application.notes = adminNotes;
  }

  if (stageName || status || notes || adminNotes) {
    addStatusHistory(application, {
      status: application.status,
      currentRound: currentRound || application.currentRound,
      notes: notes || adminNotes || `Stage updated by ${req.user.name}`,
      changedBy: req.user._id,
    });
  }

  application.progress = buildProgress(application.status);

  if (['Selected'].includes(application.status) && application.studentId) {
    const student = await User.findById(application.studentId);
    if (student) {
      student.isPlaced = true;
      student.placedCompany = (await Company.findById(application.companyId))?.companyName || student.placedCompany;
      await student.save();
    }
  }

  await application.save();

  const populated = await Application.findById(application._id)
    .populate('studentId', 'name email branch')
    .populate('companyId', 'companyName role package rounds');

  await notifyApplicationStatusUpdate(application, populated.companyId?.companyName, stageName);
  emitApplicationUpdate(populated);

  res.json(populated);
});

export const bulkUpdateApplicationStatus = asyncHandler(async (req, res) => {
  const { applicationIds, status, stageName, notes } = req.body;
  if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
    res.status(400);
    throw new Error('applicationIds array is required');
  }

  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required to update application workflow');
  }

  const applications = await Application.find({ _id: { $in: applicationIds } });
  const updates = [];

  applications.forEach((application) => {
    if (!Array.isArray(application.pipelineStages)) {
      application.pipelineStages = getDefaultPipelineStages();
    }
  });

  for (const application of applications) {
    if (status) application.status = status;
    if (stageName) {
      application.currentRound = stageName;
      application.currentStage = stageName;
      updatePipelineStage(application, stageName, {
        status: status || 'Pending',
        notes: notes || application.pipelineStages.find((stage) => stage.name === stageName)?.notes,
        updatedAt: new Date(),
      });
    }
    addStatusHistory(application, {
      status: application.status,
      currentRound: application.currentRound,
      notes: notes || `Bulk update by ${req.user.name}`,
      changedBy: req.user._id,
    });
    application.progress = buildProgress(application.status);
    updates.push(application.save());
  }

  await Promise.all(updates);

  res.json({ message: `${applications.length} applications updated` });
});

export const getRoundTracking = asyncHandler(async (req, res) => {
  const { companyId } = req.query;
  const companyFilter = companyId ? { _id: companyId } : { isActive: true };
  const companies = await Company.find(companyFilter).sort({ deadline: 1 });
  const companyIds = companies.map((company) => company._id);
  const applications = await Application.find({ companyId: { $in: companyIds } })
    .populate('studentId', 'name email branch cgpa')
    .populate('companyId', 'companyName role package rounds')
    .sort({ updatedAt: -1 });

  const grouped = companies.map((company) => {
    const companyApps = applications.filter((app) => app.companyId?._id?.toString() === company._id.toString());
    const rounds = normalizeCompanyRounds(company);
    const roundStats = rounds.map((round) => {
      const stageRows = companyApps.map((app) => app.pipelineStages?.find((stage) => stage.name === round.name)).filter(Boolean);
      return {
        name: round.name,
        type: round.type,
        sequence: round.sequence,
        driveStatus: round.driveStatus,
        scheduledAt: round.scheduledAt,
        totalEligible: stageRows.filter((stage) => ['Pending', 'Scheduled', 'Completed', 'Selected', 'Rejected'].includes(stage.status)).length,
        inProgress: stageRows.filter((stage) => stage.status === 'Scheduled').length,
        appeared: stageRows.filter((stage) => ['Completed', 'Selected', 'Rejected'].includes(stage.status)).length,
        qualified: stageRows.filter((stage) => ['Completed', 'Selected'].includes(stage.status)).length,
        rejected: stageRows.filter((stage) => stage.status === 'Rejected').length,
      };
    });

    return {
      company,
      applications: companyApps,
      roundStats,
      funnel: [
        { label: 'Applied', value: companyApps.length },
        ...roundStats.filter((round) => round.name !== 'Applied').map((round) => ({ label: round.name, value: round.qualified })),
        { label: 'Selected', value: companyApps.filter((app) => app.status === 'Selected' || app.roundStatus === 'Selected').length },
        { label: 'Rejected', value: companyApps.filter((app) => app.status === 'Rejected' || app.roundStatus === 'Rejected').length },
      ],
    };
  });

  res.json({ companies: grouped });
});

export const startRound = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const { roundName, notes, schedule = {} } = req.body;
  if (!roundName) {
    res.status(400);
    throw new Error('roundName is required');
  }

  const applications = await Application.find({ companyId, status: { $ne: 'Rejected' } });
  const touched = [];
  for (const application of applications) {
    const stage = application.pipelineStages?.find((item) => item.name === roundName);
    if (stage && ['Pending', 'Scheduled'].includes(stage.status)) {
      touched.push(saveRoundAction({ application, roundName, action: 'start', changedBy: req.user._id, notes, schedule }));
    }
  }
  const saved = await Promise.all(touched);

  await createNotification({
    role: 'student',
    type: 'application',
    title: `${roundName} started`,
    message: `${roundName} has started for a placement drive.`,
    link: '/applications',
    metadata: { companyId, roundName },
  });

  res.json({ message: `${saved.length} students moved into ${roundName}`, updated: saved.length });
});

export const closeRound = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const { roundName, notes } = req.body;
  if (!roundName) {
    res.status(400);
    throw new Error('roundName is required');
  }
  const applications = await Application.find({ companyId, currentRound: roundName, status: { $ne: 'Rejected' } });
  await Promise.all(applications.map((application) => saveRoundAction({ application, roundName, action: 'complete', changedBy: req.user._id, notes })));
  res.json({ message: `${roundName} completed`, updated: applications.length });
});

export const promoteRoundStudents = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const { roundName, qualifiedIds = [], rejectedIds = [], notes, schedule = {} } = req.body;
  if (!roundName) {
    res.status(400);
    throw new Error('roundName is required');
  }

  const [qualifiedApps, rejectedApps] = await Promise.all([
    Application.find({ _id: { $in: qualifiedIds }, companyId }),
    Application.find({ _id: { $in: rejectedIds }, companyId }),
  ]);

  const savedQualified = await Promise.all(
    qualifiedApps.map((application) => saveRoundAction({ application, roundName, action: 'promote', changedBy: req.user._id, notes, schedule }))
  );
  const savedRejected = await Promise.all(
    rejectedApps.map((application) => saveRoundAction({ application, roundName, action: 'reject', changedBy: req.user._id, notes }))
  );

  const company = await Company.findById(companyId);
  await Promise.all([
    ...savedQualified.map((application) =>
      createNotification({
        recipient: application.studentId,
        type: 'application',
        title: `Shortlisted for ${application.currentRound}`,
        message: `You have been shortlisted for ${application.currentRound} at ${company?.companyName || 'the company'}.`,
        link: '/applications',
        metadata: { applicationId: application._id, companyId, roundName: application.currentRound },
      })
    ),
    ...savedRejected.map((application) =>
      createNotification({
        recipient: application.studentId,
        type: 'application',
        title: `Rejected in ${roundName}`,
        message: `Your application at ${company?.companyName || 'the company'} was rejected in ${roundName}.`,
        link: '/applications',
        metadata: { applicationId: application._id, companyId, roundName },
      })
    ),
  ]);

  res.json({
    message: 'Round results published',
    qualified: savedQualified.length,
    rejected: savedRejected.length,
  });
});

export const deleteApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }
  if (application.studentId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }
  await application.deleteOne();
  res.json({ message: 'Application removed' });
});
