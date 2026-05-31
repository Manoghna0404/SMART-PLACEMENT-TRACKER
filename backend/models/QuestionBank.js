import mongoose from 'mongoose';

const questionBankSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    options: {
      type: [String],
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 4,
        message: 'Exactly 4 options are required',
      },
      required: true,
    },
    correctAnswer: { type: Number, required: true, min: 0, max: 3 },
    topic: { type: String, required: true, trim: true },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },
    companyTag: { type: String, default: 'General', trim: true },
    bankSet: {
      type: String,
      enum: ['set1', 'set2', 'set3'],
      default: 'set1',
      required: true,
    },
    setNumber: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },
    topicName: { type: String, default: 'General', trim: true },
    topicId: { type: String, default: 'TOPIC000', trim: true },
    isActive: { type: Boolean, default: true },
    // Tracks whether this question has already been consumed by a generated test.
    // Used to keep Question Bank UI + availability checks in sync.
    consumed: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  },
  { timestamps: true }
);

questionBankSchema.index({ topic: 1, difficulty: 1, companyTag: 1, bankSet: 1 });

export default mongoose.model('QuestionBank', questionBankSchema);
