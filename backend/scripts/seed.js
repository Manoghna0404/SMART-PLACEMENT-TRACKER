import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Company from '../models/Company.js';
import Test from '../models/Test.js';
import QuestionBank from '../models/QuestionBank.js';
import { generateTestQuestions } from '../utils/testGenerator.js';

dotenv.config();

const seedData = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({ email: { $in: ['admin@college.edu', 'demo@student.edu'] } });
  await Company.deleteMany({});
  await Test.deleteMany({});
  await QuestionBank.deleteMany({});

  await User.create({
    name: 'TPO Admin',
    email: 'admin@college.edu',
    password: 'admin123',
    role: 'admin',
  });

  const demoStudent = await User.create({
    name: 'Demo Student',
    email: 'demo@student.edu',
    password: 'student123',
    role: 'student',
    cgpa: 8.5,
    branch: 'CSE',
    backlogs: 0,
    skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Python'],
  });

  const deadline = new Date();
  deadline.setMonth(deadline.getMonth() + 2);

  await Company.insertMany([
    {
      companyName: 'TCS',
      role: 'Software Engineer',
      package: '3.5 LPA',
      description: 'Leading IT services company',
      eligibility: { minCgpa: 6.5, maxBacklogs: 0, branches: ['CSE', 'IT', 'ECE'] },
      deadline,
    },
    {
      companyName: 'Infosys',
      role: 'Systems Engineer',
      package: '4 LPA',
      description: 'Global technology services',
      eligibility: { minCgpa: 7, maxBacklogs: 0, branches: ['CSE', 'IT'] },
      deadline,
    },
    {
      companyName: 'Wipro',
      role: 'Project Engineer',
      package: '3.8 LPA',
      description: 'IT consulting and services',
      eligibility: { minCgpa: 6, maxBacklogs: 1, branches: ['CSE', 'IT', 'ECE', 'EEE'] },
      deadline,
    },
    {
      companyName: 'Amazon',
      role: 'SDE-1',
      package: '18 LPA',
      description: 'E-commerce and cloud giant',
      eligibility: { minCgpa: 8, maxBacklogs: 0, branches: ['CSE', 'IT'] },
      deadline,
    },
    {
      companyName: 'Microsoft',
      role: 'Software Engineer',
      package: '22 LPA',
      description: 'Technology corporation',
      eligibility: { minCgpa: 8.5, maxBacklogs: 0, branches: ['CSE'] },
      deadline,
    },
  ]);

  await QuestionBank.insertMany([
    { questionText: 'What is 25% of 200?', options: ['25', '50', '75', '100'], correctAnswer: 1, topic: 'Quantitative', difficulty: 'Easy', companyTag: 'General' },
    { questionText: 'If A is taller than B and B is taller than C, who is shortest?', options: ['A', 'B', 'C', 'Cannot determine'], correctAnswer: 2, topic: 'Logical Reasoning', difficulty: 'Easy', companyTag: 'General' },
    { questionText: 'Find the next number: 2, 4, 8, 16, ?', options: ['24', '32', '20', '18'], correctAnswer: 1, topic: 'Logical Reasoning', difficulty: 'Medium', companyTag: 'General' },
    { questionText: 'A train travels 120 km in 2 hours. Speed in km/h?', options: ['40', '50', '60', '80'], correctAnswer: 2, topic: 'Quantitative', difficulty: 'Easy', companyTag: 'General' },
    { questionText: 'Which data structure uses LIFO?', options: ['Queue', 'Stack', 'Tree', 'Graph'], correctAnswer: 1, topic: 'Technical', difficulty: 'Easy', companyTag: 'General' },
    { questionText: 'Time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], correctAnswer: 1, topic: 'DSA', difficulty: 'Medium', companyTag: 'General' },
    { questionText: 'Which is NOT a JavaScript framework?', options: ['React', 'Angular', 'Django', 'Vue'], correctAnswer: 2, topic: 'Technical', difficulty: 'Easy', companyTag: 'General' },
    { questionText: 'HTTP status code for "Not Found"?', options: ['200', '301', '404', '500'], correctAnswer: 2, topic: 'Technical', difficulty: 'Easy', companyTag: 'General' },
    { questionText: 'MongoDB is a ___ database.', options: ['Relational', 'NoSQL', 'Graph', 'Column'], correctAnswer: 1, topic: 'Technical', difficulty: 'Easy', companyTag: 'General' },
    { questionText: 'TCS aptitude: What is 15% of 80?', options: ['10', '12', '14', '16'], correctAnswer: 1, topic: 'Quantitative', difficulty: 'Easy', companyTag: 'TCS' },
    { questionText: 'Infosys: Which sorting has best average case?', options: ['Bubble', 'Quick', 'Selection', 'Insertion'], correctAnswer: 1, topic: 'DSA', difficulty: 'Medium', companyTag: 'Infosys' },
  ]);

  const companies = await Company.find();
  const tcs = companies.find((c) => c.companyName === 'TCS');

  const generalQuestions = await generateTestQuestions({
    numberOfQuestions: 5,
    topics: [],
    difficulty: 'Mixed',
    testType: 'general',
  });

  await Test.create({
    title: 'General Aptitude Test 1',
    description: 'Auto-generated from question bank',
    duration: 15,
    numberOfQuestions: 5,
    topics: [],
    difficulty: 'Mixed',
    testType: 'general',
    questions: generalQuestions,
  });

  if (tcs) {
    const tcsQuestions = await generateTestQuestions({
      numberOfQuestions: 3,
      topics: ['Quantitative', 'DSA'],
      difficulty: 'Mixed',
      companyTag: 'TCS',
      testType: 'company',
    });

    await Test.create({
      title: 'TCS Placement Screening Test',
      description: 'Company-specific — one attempt only',
      duration: 10,
      numberOfQuestions: 3,
      topics: ['Quantitative', 'DSA'],
      difficulty: 'Mixed',
      testType: 'company',
      companyId: tcs._id,
      allowedStudentIds: [demoStudent._id],
      questions: tcsQuestions,
    });
  }

  console.log('Seed data created successfully!');
  console.log('Admin: admin@college.edu / admin123');
  console.log('Student: demo@student.edu / student123');
  process.exit(0);
};

seedData().catch((err) => {
  console.error(err);
  process.exit(1);
});
