import crypto from 'crypto';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { sendTemplateEmail } from '../services/emailService.js';

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, cgpa, branch, backlogs, skills } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email and password');
  }

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: 'student',
    cgpa: cgpa || 0,
    branch: branch || '',
    backlogs: backlogs || 0,
    skills: skills ? (Array.isArray(skills) ? skills : skills.split(',').map((s) => s.trim())) : [],
  });

  sendTemplateEmail({
    to: user.email,
    templateName: 'welcome',
    templateData: {
      user,
      actionUrl: frontendUrl,
    },
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    cgpa: user.cgpa,
    branch: user.branch,
    token: generateToken(user._id),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    cgpa: user.cgpa,
    branch: user.branch,
    backlogs: user.backlogs,
    skills: user.skills,
    resumeUrl: user.resumeUrl,
    resumeScore: user.resumeScore,
    isPlaced: user.isPlaced,
    token: generateToken(user._id),
  });
});

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ message: 'If an account exists, a password reset email has been sent.' });
  }

  const resetToken = crypto.randomBytes(24).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  sendTemplateEmail({
    to: user.email,
    templateName: 'forgotPassword',
    templateData: {
      user,
      resetUrl,
    },
  });

  res.json({ message: 'If an account exists, a password reset email has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400);
    throw new Error('Reset token and new password are required');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  user.password = password;
  user.passwordResetToken = '';
  user.passwordResetExpires = null;
  await user.save();

  sendTemplateEmail({
    to: user.email,
    templateName: 'passwordResetConfirmation',
    templateData: {
      user,
      actionUrl: frontendUrl,
    },
  });

  res.json({ message: 'Password reset successful. You can now sign in with your new password.' });
});
