import mongoose from 'mongoose';

const interviewExperienceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    studentName: { type: String, required: true },
    companyName: { type: String, required: true },
    role: { type: String, default: '' },
    rounds: { type: Number, default: 1 },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    questions: [{ type: String }],
    experience: { type: String, required: true },
    outcome: { type: String, enum: ['Selected', 'Rejected', 'Pending'], default: 'Pending' },
  },
  { timestamps: true }
);

export default mongoose.model('InterviewExperience', interviewExperienceSchema);
