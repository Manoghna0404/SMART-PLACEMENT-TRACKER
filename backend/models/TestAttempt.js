import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionIndex: Number,
  selectedAnswer: Number,
  isCorrect: Boolean,
  markedForReview: { type: Boolean, default: false },
});

const topicBreakdownSchema = new mongoose.Schema({
  topic: String,
  correct: Number,
  total: Number,
});

const testAttemptSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
    testType: { type: String, enum: ['general', 'company'], default: 'general' },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    wrongAnswers: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    percentile: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    weakAreas: [{ type: String }],
    topicBreakdown: [topicBreakdownSchema],
    answers: [answerSchema],
    markedForReview: [{ type: Number }],
    timeTakenSeconds: { type: Number, default: 0 },
    autoSubmitted: { type: Boolean, default: false },
    startedAt: { type: Date },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

testAttemptSchema.index({ studentId: 1, testId: 1 }, { unique: false });

export default mongoose.model('TestAttempt', testAttemptSchema);
