import mongoose from 'mongoose';

const testQuestionSchema = new mongoose.Schema({
  questionBankId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuestionBank' },
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: Number, required: true },
  topic: { type: String, default: 'General' },
  difficulty: { type: String, default: 'Medium' },
  companyTag: { type: String, default: 'General' },
  bankSet: { type: String, enum: ['set1', 'set2', 'set3'], default: 'set1' },
  topicName: { type: String, default: 'General' },
  topicId: { type: String, default: 'TOPIC000' },
});

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    duration: { type: Number, required: true, min: 1 },
    numberOfQuestions: { type: Number, required: true, min: 1 },
    topics: [{ type: String }],
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard', 'Mixed'],
      default: 'Mixed',
    },
    testType: {
      type: String,
      enum: ['general', 'company'],
      default: 'general',
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    allowedStudentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    passingScore: { type: Number, default: 60, min: 0, max: 100 },
    randomizeQuestions: { type: Boolean, default: true },
    topicName: { type: String, default: 'General' },
    topicId: { type: String, default: 'TOPIC000' },
    questions: [testQuestionSchema],
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Test', testSchema);
