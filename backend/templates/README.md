# Email Template Folder

This folder contains documentation for backend email templates used by `backend/services/emailTemplates.js`.

Supported template names:
- `welcome`
- `forgotPassword`
- `passwordResetConfirmation`
- `otpVerification`
- `placementDrive`
- `testAssignment`
- `interviewSchedule`
- `adminAnnouncement`
- `resumeStatus`
- `applicationStatus`

To extend the email system, add a new case in `backend/services/emailTemplates.js` and reference it from your backend controller or service.
