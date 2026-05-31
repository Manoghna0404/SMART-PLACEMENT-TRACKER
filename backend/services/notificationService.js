import User from '../models/User.js';
import Company from '../models/Company.js';
import { createNotification } from '../utils/realtime.js';
import { sendBulkTemplateEmail, sendTemplateEmail } from './emailService.js';
import { checkEligibility } from '../utils/eligibilityChecker.js';

const getRecipientsByRole = async (role) => {
  if (role === 'all') {
    return User.find({ role: { $in: ['student', 'admin'] } }).select('name email role');
  }
  return User.find({ role }).select('name email role');
};

const resolveCompany = async (company) => {
  if (!company) return null;
  if (typeof company === 'string') {
    return Company.findById(company);
  }
  if (company._id) return company;
  return Company.findById(company);
};

const getEligibleStudentsForCompany = async (company) => {
  const companyDoc = await resolveCompany(company);
  if (!companyDoc) return [];

  const filter = {
    role: 'student',
    cgpa: { $gte: companyDoc.eligibility?.minCgpa || 0 },
    backlogs: { $lte: companyDoc.eligibility?.maxBacklogs || 0 },
  };

  if (companyDoc.eligibility?.branches?.length) {
    filter.branch = { $in: companyDoc.eligibility.branches };
  }

  const candidates = await User.find(filter).select('name email branch cgpa backlogs skills');
  return candidates.filter((student) => checkEligibility(student, companyDoc).eligible);
};

const getUserById = async (userId) => User.findById(userId).select('name email role');

export const notifyPlacementDriveCreation = async (company) => {
  const eligibleStudents = await getEligibleStudentsForCompany(company);

  await createNotification({
    role: 'student',
    type: 'company',
    title: 'New placement drive announced',
    message: `${company.companyName} is hiring for ${company.role}`,
    link: '/companies',
    metadata: { companyId: company._id },
  });

  if (eligibleStudents.length) {
    sendBulkTemplateEmail({
      recipients: eligibleStudents,
      templateName: 'placementDrive',
      subject: (student) => `New drive: ${company.companyName} - ${company.role}`,
      customData: (student) => ({
        company,
        user: student,
        frontendBaseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      }),
    });
  }
};

export const notifyOnlineTestAssignment = async (test) => {
  const role = 'student';
  const recipients = test.testType === 'company' && test.companyId
    ? await getEligibleStudentsForCompany(test.companyId)
    : await getRecipientsByRole(role);

  await createNotification({
    role,
    type: 'test',
    title: 'New assessment published',
    message: `${test.title} is now available`,
    link: '/tests',
    metadata: { testId: test._id },
  });

  if (Array.isArray(recipients) && recipients.length) {
    sendBulkTemplateEmail({
      recipients,
      templateName: 'testAssignment',
      subject: (student) => `New test available: ${test.title}`,
      customData: (student) => ({
        test,
        frontendBaseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
        user: student,
      }),
    });
  }
};

export const notifyInterviewScheduled = async (schedule, application) => {
  const student = await getUserById(application.studentId);
  if (!student) return;

  await createNotification({
    recipient: student._id,
    type: 'interview',
    title: 'Interview scheduled',
    message: `${application.companyId.companyName} interview scheduled`,
    link: '/interviews',
    metadata: { scheduleId: schedule._id, applicationId: application._id },
  });

  sendTemplateEmail({
    to: student.email,
    templateName: 'interviewSchedule',
    templateData: {
      schedule,
      company: application.companyId,
      frontendBaseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      user: student,
      // Ensure the template uses email instead of applicationId for any email-related display
      applicationEmail: student.email,
      applicationId: application?._id,
    },
  });

};

export const notifyAdminAnnouncement = async ({ recipient, role = 'all', title, message, type = 'system', link = '', metadata = {} }) => {
  const notification = await createNotification({ recipient, role, title, message, type, link, metadata });
  const recipients = recipient
    ? [(await getUserById(recipient))].filter(Boolean)
    : await getRecipientsByRole(role);

  if (recipients.length) {
    sendBulkTemplateEmail({
      recipients,
      templateName: 'adminAnnouncement',
      subject: () => title,
      customData: () => ({
        title,
        message,
        frontendBaseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      }),
    });
  }

  return notification;
};

export const notifyResumeStatusUpdate = async (user) => {
  await createNotification({
    recipient: user._id,
    type: 'resume',
    title: 'Resume uploaded and analyzed',
    message: `Your resume has been analyzed. Score: ${user.resumeScore}`,
    link: '/profile',
    metadata: { resumeStatus: user.resumeStatus, score: user.resumeScore },
  });

  sendTemplateEmail({
    to: user.email,
    templateName: 'resumeStatus',
    subject: `Resume analysis complete: ${user.resumeStatus}`,
    templateData: {
      status: user.resumeStatus,
      score: user.resumeScore,
      comments: `Review your resume analysis and update it to improve placement chances.`,
      frontendBaseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    },
  });
};

export const notifyApplicationStatusUpdate = async (application, companyName, stageName) => {
  const student = await getUserById(application.studentId);
  if (!student) return;

  const roundLabel = stageName || application.currentRound || application.status;
  const message = `${companyName || 'A company'} updated your application workflow to ${roundLabel}`;

  await createNotification({
    recipient: student._id,
    type: 'application',
    title: 'Application workflow update',
    message,
    link: '/applications',
    metadata: { applicationId: application._id, status: application.status, round: roundLabel },
  });

  sendTemplateEmail({
    to: student.email,
    templateName: 'applicationStatus',
    subject: `Application update: ${roundLabel}`,
    templateData: {
      status: application.status,
      currentRound: application.currentRound,
      stageName: roundLabel,
      companyName,
      notes: application.notes || '',
      frontendBaseUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    },
  });
};
