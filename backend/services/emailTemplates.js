export const buildEmailTemplate = ({ title, intro, message, actionText, actionUrl, footer }) => {
  const actionButton = actionText && actionUrl
    ? `<tr><td align="center" style="padding: 24px 0;"><a href="${actionUrl}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 999px; text-decoration: none; display: inline-block; font-weight: 600;">${actionText}</a></td></tr>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; color: #111827; }
    .email-body { width: 100%; max-width: 680px; margin: 0 auto; padding: 24px; }
    .card { background: #ffffff; border-radius: 28px; box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08); overflow: hidden; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #0f766e 100%); color: #ffffff; padding: 32px 32px 24px; }
    .header h1 { margin: 0; font-size: 28px; line-height: 1.1; }
    .content { padding: 32px; }
    .content p { margin: 0 0 18px; font-size: 16px; line-height: 1.7; color: #334155; }
    .footer { padding: 24px 32px 32px; font-size: 13px; color: #64748b; }
    .footer a { color: #4f46e5; text-decoration: none; }
    .detail { background: #f8fafc; border-radius: 18px; padding: 18px; margin: 18px 0; }
    .detail p { margin: 0; font-size: 14px; color: #475569; }
    @media (max-width: 600px) {
      .email-body { padding: 18px; }
      .header { padding: 24px 24px 18px; }
      .content { padding: 24px; }
      .footer { padding: 18px; }
    }
  </style>
</head>
<body>
  <div class="email-body">
    <div class="card">
      <div class="header">
        <h1>${title}</h1>
      </div>
      <div class="content">
        <p>${intro}</p>
        <div class="detail">
          <p>${message}</p>
        </div>
        ${actionButton}
      </div>
      <div class="footer">
        <p>${footer}</p>
        <p>If you need support, reply to this email and our team will assist you.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
};

export const buildPlainTextTemplate = ({ title, intro, message, actionText, actionUrl, footer }) => {
  const buttonLine = actionText && actionUrl ? `\n${actionText}: ${actionUrl}` : '';
  return `${title}\n\n${intro}\n\n${message}${buttonLine}\n\n${footer}`;
};

export const getEmailTemplate = (type, data = {}) => {
  const commonFooter = 'Smart Placement Tracker • AI-enabled campus placement platform';

  switch (type) {
    case 'placementDrive':
      return {
        subject: `New placement drive: ${data.company.companyName}`,
        html: buildEmailTemplate({
          title: `New placement drive available`,
          intro: `A new placement drive has been posted for ${data.company.role} at ${data.company.companyName}.`,
          message: `Package: ${data.company.package || 'Not specified'}\nDeadline: ${data.company.deadline ? new Date(data.company.deadline).toLocaleDateString() : 'Open'}\nEligibility: ${data.company.eligibility?.branches?.length ? data.company.eligibility.branches.join(', ') : 'All branches'}`,
          actionText: 'View available drives',
          actionUrl: `${data.frontendBaseUrl || ''}/companies`,
          footer: commonFooter,
        }),
        text: buildPlainTextTemplate({
          title: `New placement drive available`,
          intro: `A new placement drive has been posted for ${data.company.role} at ${data.company.companyName}.`,
          message: `Package: ${data.company.package || 'Not specified'}\nDeadline: ${data.company.deadline ? new Date(data.company.deadline).toLocaleDateString() : 'Open'}\nEligibility: ${data.company.eligibility?.branches?.length ? data.company.eligibility.branches.join(', ') : 'All branches'}`,
          actionText: 'View available drives',
          actionUrl: `${data.frontendBaseUrl || ''}/companies`,
          footer: commonFooter,
        }),
      };
    case 'testAssignment':
      return {
        subject: `New assessment published: ${data.test.title}`,
        html: buildEmailTemplate({
          title: `New online test assigned`,
          intro: `A new test is now available for you to complete.`,
          message: `Title: ${data.test.title}\nDescription: ${data.test.description || 'No description provided'}\nDuration: ${data.test.duration || 'N/A'} minutes\nAvailable: ${data.test.startsAt ? new Date(data.test.startsAt).toLocaleString() : 'Now'} to ${data.test.endsAt ? new Date(data.test.endsAt).toLocaleString() : 'No deadline'}`,
          actionText: 'Start your test',
          actionUrl: `${data.frontendBaseUrl || ''}/tests`,
          footer: commonFooter,
        }),
        text: buildPlainTextTemplate({
          title: `New online test assigned`,
          intro: `A new test is now available for you to complete.`,
          message: `Title: ${data.test.title}\nDescription: ${data.test.description || 'No description provided'}\nDuration: ${data.test.duration || 'N/A'} minutes\nAvailable: ${data.test.startsAt ? new Date(data.test.startsAt).toLocaleString() : 'Now'} to ${data.test.endsAt ? new Date(data.test.endsAt).toLocaleString() : 'No deadline'}`,
          actionText: 'Start your test',
          actionUrl: `${data.frontendBaseUrl || ''}/tests`,
          footer: commonFooter,
        }),
      };
    case 'interviewSchedule':
      return {
        subject: `Interview scheduled with ${data.company.companyName}`,
        html: buildEmailTemplate({
          title: `Interview scheduled`,
          intro: `Your interview has been scheduled for ${data.company.companyName}.`,
          message: `Round: ${data.schedule.roundName || data.schedule.roundType || 'Interview'}\nDate & Time: ${new Date(data.schedule.scheduledAt).toLocaleString()}\nMode: ${data.schedule.mode || 'N/A'}\nLocation/Link: ${data.schedule.meetingLink || data.schedule.location || 'TBD'}`,
          actionText: 'View interview details',
          actionUrl: `${data.frontendBaseUrl || ''}/interviews`,
          footer: commonFooter,
        }),
        text: buildPlainTextTemplate({
          title: `Interview scheduled`,
          intro: `Your interview has been scheduled for ${data.company.companyName}.`,
          message: `Round: ${data.schedule.roundName || data.schedule.roundType || 'Interview'}\nDate & Time: ${new Date(data.schedule.scheduledAt).toLocaleString()}\nMode: ${data.schedule.mode || 'N/A'}\nLocation/Link: ${data.schedule.meetingLink || data.schedule.location || 'TBD'}`,
          actionText: 'View interview details',
          actionUrl: `${data.frontendBaseUrl || ''}/interviews`,
          footer: commonFooter,
        }),
      };
    case 'adminAnnouncement':
      return {
        subject: data.title,
        html: buildEmailTemplate({
          title: data.title,
          intro: data.message,
          message: `This announcement was posted by the admin team.`,
          actionText: 'View announcements',
          actionUrl: `${data.frontendBaseUrl || ''}/notifications`,
          footer: commonFooter,
        }),
        text: buildPlainTextTemplate({
          title: data.title,
          intro: data.message,
          message: `This announcement was posted by the admin team.`,
          actionText: 'View announcements',
          actionUrl: `${data.frontendBaseUrl || ''}/notifications`,
          footer: commonFooter,
        }),
      };
    case 'resumeStatus':
      return {
        subject: `Resume analysis complete: ${data.status}`,
        html: buildEmailTemplate({
          title: `Resume analysis update`,
          intro: `Your resume has been processed successfully.`,
          message: `Status: ${data.status}\nScore: ${data.score || 'N/A'}\n${data.comments || ''}`,
          actionText: 'View your resume profile',
          actionUrl: `${data.frontendBaseUrl || ''}/profile`,
          footer: commonFooter,
        }),
        text: buildPlainTextTemplate({
          title: `Resume analysis update`,
          intro: `Your resume has been processed successfully.`,
          message: `Status: ${data.status}\nScore: ${data.score || 'N/A'}\n${data.comments || ''}`,
          actionText: 'View your resume profile',
          actionUrl: `${data.frontendBaseUrl || ''}/profile`,
          footer: commonFooter,
        }),
      };
    case 'applicationStatus':
      return {
        subject: `Application update: ${data.status}`,
        html: buildEmailTemplate({
          title: `Application status updated`,
          intro: `Your application status has changed for ${data.companyName || 'the company'}.`,
          message: `Current status: ${data.status}\nRound: ${data.currentRound || 'N/A'}\nNotes: ${data.notes || 'No additional notes'}`,
          actionText: 'View application',
          actionUrl: `${data.frontendBaseUrl || ''}/applications`,
          footer: commonFooter,
        }),
        text: buildPlainTextTemplate({
          title: `Application status updated`,
          intro: `Your application status has changed for ${data.companyName || 'the company'}.`,
          message: `Current status: ${data.status}\nRound: ${data.currentRound || 'N/A'}\nNotes: ${data.notes || 'No additional notes'}`,
          actionText: 'View application',
          actionUrl: `${data.frontendBaseUrl || ''}/applications`,
          footer: commonFooter,
        }),
      };
    case 'welcome':
      return {
        subject: `Welcome to Smart Placement Tracker, ${data.user?.name || 'Student'}!`,
        html: buildEmailTemplate({
          title: `Welcome to Smart Placement Tracker`,
          intro: `Thanks for joining the platform. Your account is now active and ready to use.`,
          message: `Get started by exploring placement drives, ongoing applications, mock tests, and resume insights.`,
          actionText: 'Open dashboard',
          actionUrl: data.actionUrl || `${data.frontendBaseUrl || ''}/dashboard`,
          footer: commonFooter,
        }),
        text: buildPlainTextTemplate({
          title: `Welcome to Smart Placement Tracker`,
          intro: `Thanks for joining the platform. Your account is now active and ready to use.`,
          message: `Get started by exploring placement drives, ongoing applications, mock tests, and resume insights.`,
          actionText: 'Open dashboard',
          actionUrl: data.actionUrl || `${data.frontendBaseUrl || ''}/dashboard`,
          footer: commonFooter,
        }),
      };
    case 'forgotPassword':
      return {
        subject: 'Reset your Smart Placement Tracker password',
        html: buildEmailTemplate({
          title: 'Password reset request',
          intro: `We received a request to reset the password for ${data.user?.email || 'your account'}.`,
          message: `Click the button below to choose a new password. This link will expire in 15 minutes. If you did not request the reset, no further action is required.`,
          actionText: 'Reset my password',
          actionUrl: data.resetUrl,
          footer: commonFooter,
        }),
        text: buildPlainTextTemplate({
          title: 'Password reset request',
          intro: `We received a request to reset the password for ${data.user?.email || 'your account'}.`,
          message: `Click the link below to choose a new password. This link will expire in 15 minutes. If you did not request the reset, no further action is required.`,
          actionText: 'Reset my password',
          actionUrl: data.resetUrl,
          footer: commonFooter,
        }),
      };
    case 'passwordResetConfirmation':
      return {
        subject: 'Your password has been updated',
        html: buildEmailTemplate({
          title: 'Password reset complete',
          intro: `Your Smart Placement Tracker password was successfully changed.`,
          message: `If you made this change, you can now sign in with your new password. If you did not request this, contact support immediately.`,
          actionText: 'Sign in now',
          actionUrl: data.actionUrl || `${data.frontendBaseUrl || ''}/login`,
          footer: commonFooter,
        }),
        text: buildPlainTextTemplate({
          title: 'Password reset complete',
          intro: `Your Smart Placement Tracker password was successfully changed.`,
          message: `If you made this change, you can now sign in with your new password. If you did not request this, contact support immediately.`,
          actionText: 'Sign in now',
          actionUrl: data.actionUrl || `${data.frontendBaseUrl || ''}/login`,
          footer: commonFooter,
        }),
      };
    case 'otpVerification':
      return {
        subject: 'Your verification code',
        html: buildEmailTemplate({
          title: 'Verification code',
          intro: `Use the code below to complete your verification.`,
          message: `Your secure verification code is: ${data.code || 'XXXXXX'}. It expires shortly.`,
          footer: commonFooter,
        }),
        text: buildPlainTextTemplate({
          title: 'Verification code',
          intro: `Use the code below to complete your verification.`,
          message: `Your secure verification code is: ${data.code || 'XXXXXX'}. It expires shortly.`,
          footer: commonFooter,
        }),
      };
    default:
      return {
        subject: data.title || 'Smart Placement Tracker update',
        html: buildEmailTemplate({
          title: data.title || 'Update from Smart Placement Tracker',
          intro: data.message || '',
          message: data.details || 'Please sign in to see the latest update.',
          actionText: data.actionText || 'Open dashboard',
          actionUrl: data.actionUrl || `${data.frontendBaseUrl || ''}/`,
          footer: commonFooter,
        }),
        text: buildPlainTextTemplate({
          title: data.title || 'Smart Placement Tracker update',
          intro: data.message || '',
          message: data.details || 'Please sign in to see the latest update.',
          actionText: data.actionText || 'Open dashboard',
          actionUrl: data.actionUrl || `${data.frontendBaseUrl || ''}/`,
          footer: commonFooter,
        }),
      };
  }
};
