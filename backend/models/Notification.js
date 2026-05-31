import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    role: { type: String, enum: ['student', 'admin', 'all'], default: 'all' },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['company', 'test', 'application', 'interview', 'result', 'system', 'resume'],
      default: 'system',
    },
    link: { type: String, default: '' },
    // Track which users have read this notification along with timestamp
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        readAt: { type: Date },
      },
    ],
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, role: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
