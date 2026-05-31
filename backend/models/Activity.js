import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['application', 'test', 'resume', 'interview', 'placement', 'profile'],
      default: 'profile',
    },
    status: { type: String, default: '' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activitySchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.model('Activity', activitySchema);
