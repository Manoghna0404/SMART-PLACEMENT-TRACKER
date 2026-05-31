import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const resumeHistorySchema = new mongoose.Schema(
  {
    url: String,
    originalName: String,
    size: Number,
    score: Number,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
    cgpa: { type: Number, default: 0 },
    branch: { type: String, default: '' },
    backlogs: { type: Number, default: 0 },
    skills: [{ type: String }],
    resumeUrl: { type: String, default: '' },
    resumeScore: { type: Number, default: 0 },
    resumeAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
    resumeStatus: {
      type: String,
      enum: ['Missing', 'Uploaded', 'Analyzed', 'Needs Update'],
      default: 'Missing',
    },
    resumeHistory: [resumeHistorySchema],
    isPlaced: { type: Boolean, default: false },
    placedCompany: { type: String, default: '' },
    passwordResetToken: { type: String, default: '' },
    passwordResetExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
