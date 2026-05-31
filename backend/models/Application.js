import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    round: { type: String, default: '' },
    notes: { type: String, default: '' },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const pipelineStageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Scheduled', 'Completed', 'Failed', 'Cancelled', 'Selected', 'Rejected'],
      default: 'Pending',
    },
    scheduledAt: { type: Date, default: null },
    mode: { type: String, enum: ['Online', 'Offline', 'Hybrid'], default: 'Online' },
    meetingLink: { type: String, default: '' },
    location: { type: String, default: '' },
    interviewer: { type: String, default: '' },
    notes: { type: String, default: '' },
    feedback: { type: String, default: '' },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentEmail: { type: String, required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    status: {
      type: String,
      default: 'Applied',
    },
    roundStatus: {
      type: String,
      enum: ['Applied', 'Eligible', 'In Progress', 'Completed', 'Shortlisted', 'Rejected', 'Selected', 'Offer Released'],
      default: 'Applied',
    },
    currentRound: { type: String, default: 'Application Submitted' },
    currentStage: { type: String, default: 'Application Submitted' },
    currentStageIndex: { type: Number, default: 0 },
    pipelineStages: { type: [pipelineStageSchema], default: [] },
    statusHistory: { type: [statusHistorySchema], default: [] },
    interviewDate: { type: Date },
    interviewMode: { type: String, enum: ['Online', 'Offline', 'Hybrid'], default: 'Online' },
    meetingLink: { type: String, default: '' },
    location: { type: String, default: '' },
    notes: { type: String, default: '' },
    appliedDate: { type: Date, default: Date.now },
    progress: { type: Number, default: 10 },
  },
  { timestamps: true }
);

applicationSchema.index({ studentId: 1, companyId: 1 }, { unique: true });

export default mongoose.model('Application', applicationSchema);
