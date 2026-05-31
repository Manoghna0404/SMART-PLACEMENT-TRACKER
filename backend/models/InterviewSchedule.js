import mongoose from 'mongoose';

const interviewScheduleSchema = new mongoose.Schema(
  {
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    roundName: { type: String, default: 'Technical Interview' },
    roundType: {
      type: String,
      enum: ['Aptitude', 'Technical', 'HR', 'Managerial', 'Other'],
      default: 'Technical',
    },
    scheduledAt: { type: Date, required: true },
    mode: { type: String, enum: ['Online', 'Offline'], default: 'Online' },
    meetingLink: { type: String, default: '' },
    location: { type: String, default: '' },
    interviewer: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
      default: 'Scheduled',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

interviewScheduleSchema.index({ studentId: 1, scheduledAt: 1 });
interviewScheduleSchema.index({ companyId: 1, scheduledAt: 1 });

export default mongoose.model('InterviewSchedule', interviewScheduleSchema);
