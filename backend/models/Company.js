import mongoose from 'mongoose';

const driveRoundSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['Application', 'Aptitude', 'Coding', 'Technical', 'GD', 'Managerial', 'HR', 'Offer', 'Other'],
      default: 'Other',
    },
    sequence: { type: Number, default: 1 },
    passingCriteria: { type: String, default: '' },
    scheduledAt: { type: Date, default: null },
    mode: { type: String, enum: ['Online', 'Offline', 'Hybrid'], default: 'Online' },
    meetingLink: { type: String, default: '' },
    location: { type: String, default: '' },
    status: { type: String, enum: ['Draft', 'Open', 'Closed'], default: 'Draft' },
  },
  { _id: false }
);

const companySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    role: { type: String, required: true },
    package: { type: String, required: true },
    description: { type: String, default: '' },
    eligibility: {
      minCgpa: { type: Number, default: 0 },
      maxBacklogs: { type: Number, default: 0 },
      branches: [{ type: String }],
      requiredSkills: [{ type: String }],
      passingCriteria: { type: String, default: '' },
    },
    rounds: {
      type: [driveRoundSchema],
      default: [
        { name: 'Application Screening', type: 'Application', sequence: 1 },
        { name: 'Aptitude Round', type: 'Aptitude', sequence: 2 },
        { name: 'Technical Interview', type: 'Technical', sequence: 3 },
        { name: 'HR Interview', type: 'HR', sequence: 4 },
      ],
    },
    testWindow: {
      startsAt: { type: Date, default: null },
      endsAt: { type: Date, default: null },
    },
    hiringMode: { type: String, enum: ['On Campus', 'Virtual', 'Hybrid'], default: 'On Campus' },
    deadline: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Company', companySchema);
