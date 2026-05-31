import Test from '../models/Test.js';
import TestAttempt from '../models/TestAttempt.js';
import Company from '../models/Company.js';
import User from '../models/User.js';
import QuestionBankSet from '../models/QuestionBankSet.js';
import QuestionBank from '../models/QuestionBank.js';
import Activity from '../models/Activity.js';
import Application from '../models/Application.js';
import { generateTestQuestions } from '../utils/testGenerator.js';
import { checkEligibility } from '../utils/eligibilityChecker.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';
import { notifyOnlineTestAssignment } from '../services/notificationService.js';
import { createNotification } from '../utils/realtime.js';

const stripCorrectAnswers = (test) => {
  const obj = test.toObject ? test.toObject() : { ...test };
  obj.questions = obj.questions.map((q) => {
    const { correctAnswer, ...rest } = q;
    return rest;
  });
  return obj;
};

const getCompanyEligibilityFilter = (company) => {
  const { minCgpa = 0, maxBacklogs = 0, branches = [] } = company.eligibility || {};
  const filter = {
    role: 'student',
    cgpa: { $gte: minCgpa },
    backlogs: { $lte: maxBacklogs },
  };
  if (branches && branches.length) {
    filter.branch = { $in: branches };
  }
  return filter;
};

const getEligibleStudentCount = async (company) => {
  return User.countDocuments(getCompanyEligibilityFilter(company));
};

const getEligibleStudentsPreview = async (company, limit = 5) => {
  return User.find(getCompanyEligibilityFilter(company))
    .select('name email branch cgpa')
    .limit(limit);
};

const canAccessTest = async (test, student) => {
  if (test.testType === 'general') return true;
  if (!test.companyId) return false;

  let company = test.companyId;
  if (!company.eligibility) {
    company = await Company.findById(test.companyId).select('eligibility');
  }
  if (!company) return false;

  return checkEligibility(student, company).eligible;
};

const hasAttempted = async (testId, studentId) => {
  const attempt = await TestAttempt.findOne({ testId, studentId });
  return !!attempt;
};

const isInsideTestWindow = (test) => {
  const now = Date.now();
  if (test.startsAt && now < new Date(test.startsAt).getTime()) return false;
  if (test.endsAt && now > new Date(test.endsAt).getTime()) return false;
  return true;
};

// ─── Student routes ───────────────────────────────────────────────

export const getTests = asyncHandler(async (req, res) => {
  const allTests = await Test.find({ isActive: true })
    .populate('companyId', 'companyName eligibility')
    .select('-questions.correctAnswer')
    .sort({ createdAt: -1 });

  const attemptMap = {};
  const attempts = await TestAttempt.find({ studentId: req.user._id }).select('testId score');
  attempts.forEach((a) => {
    attemptMap[a.testId.toString()] = a;
  });

  const generalTests = [];
  const companyTests = [];

  for (const test of allTests) {
    const accessible = await canAccessTest(test, req.user);
    if (!accessible) continue;

    const summary = {
      _id: test._id,
      title: test.title,
      description: test.description,
      duration: test.duration,
      numberOfQuestions: test.numberOfQuestions || test.questions?.length,
      testType: test.testType,
      topics: test.topics,
      difficulty: test.difficulty,
      startsAt: test.startsAt,
      endsAt: test.endsAt,
      passingScore: test.passingScore,
      companyId: test.companyId,
      companyName: test.companyId?.companyName,
      attempted: !!attemptMap[test._id.toString()],
      score: attemptMap[test._id.toString()]?.score,
      oneAttemptOnly: test.testType === 'company',
    };

    if (test.testType === 'company') companyTests.push(summary);
    else generalTests.push(summary);
  }

  res.json({ generalTests, companyTests });
});

export const getTestById = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id).populate('companyId', 'companyName eligibility');
  if (!test || !test.isActive) {
    res.status(404);
    throw new Error('Test not found');
  }

  if (!isInsideTestWindow(test)) {
    res.status(403);
    throw new Error('This test is not currently within its scheduled window');
  }

  const accessible = await canAccessTest(test, req.user);
  if (!accessible) {
    res.status(403);
    throw new Error('You are not allowed to access this test');
  }

  if (test.testType === 'company') {
    const attempted = await hasAttempted(test._id, req.user._id);
    if (attempted) {
      res.status(403);
      throw new Error('You have already attempted this company test');
    }
  }

  res.json(stripCorrectAnswers(test));
});

export const startTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id).populate('companyId', 'companyName eligibility');
  if (!test || !test.isActive) {
    res.status(404);
    throw new Error('Test not found');
  }

  if (!isInsideTestWindow(test)) {
    res.status(403);
    throw new Error('This test is not currently within its scheduled window');
  }

  const accessible = await canAccessTest(test, req.user);
  if (!accessible) {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (test.testType === 'company') {
    const attempted = await hasAttempted(test._id, req.user._id);
    if (attempted) {
      res.status(403);
      throw new Error('One attempt only for company-specific tests');
    }
  }

  res.json({
    test: stripCorrectAnswers(test),
    startedAt: new Date().toISOString(),
    durationSeconds: test.duration * 60,
  });
});

export const submitTest = asyncHandler(async (req, res) => {
  const { answers, markedForReview = [], timeTakenSeconds = 0, autoSubmitted = false, startedAt } = req.body;
  const test = await Test.findById(req.params.id).populate('companyId', 'companyName eligibility');
  if (!test || !test.isActive) {
    res.status(404);
    throw new Error('Test not found');
  }

  if (!isInsideTestWindow(test)) {
    res.status(403);
    throw new Error('This test is not currently within its scheduled window');
  }

  const accessible = await canAccessTest(test, req.user);
  if (!accessible) {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (test.testType === 'company') {
    const attempted = await hasAttempted(test._id, req.user._id);
    if (attempted) {
      res.status(400);
      throw new Error('You have already submitted this test');
    }
  }

  let correctAnswers = 0;
  const weakAreaMap = {};
  const topicMap = {};
  const detailedAnswers = [];
  const answeredIndexes = new Set();

  (answers || []).forEach(({ questionIndex, selectedAnswer, markedForReview: mfr }) => {
    const question = test.questions[questionIndex];
    if (!question) return;
    answeredIndexes.add(questionIndex);

    const isCorrect =
      selectedAnswer !== undefined &&
      selectedAnswer !== null &&
      question.correctAnswer === selectedAnswer;

    if (isCorrect) correctAnswers++;
    else {
      const topic = question.topic || 'General';
      weakAreaMap[topic] = (weakAreaMap[topic] || 0) + 1;
    }

    const topic = question.topic || 'General';
    if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
    topicMap[topic].total++;
    if (isCorrect) topicMap[topic].correct++;

    detailedAnswers.push({
      questionIndex,
      selectedAnswer: selectedAnswer ?? -1,
      isCorrect,
      markedForReview: mfr || markedForReview.includes(questionIndex),
    });
  });

  const totalQuestions = test.questions.length;
  test.questions.forEach((question, questionIndex) => {
    if (answeredIndexes.has(questionIndex)) return;
    const topic = question.topic || 'General';
    weakAreaMap[topic] = (weakAreaMap[topic] || 0) + 1;
    if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
    topicMap[topic].total++;
    detailedAnswers.push({
      questionIndex,
      selectedAnswer: -1,
      isCorrect: false,
      markedForReview: markedForReview.includes(questionIndex),
    });
  });

  const score = totalQuestions ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const wrongAnswers = totalQuestions - correctAnswers;
  const accuracy = answers?.length ? Math.round((correctAnswers / answers.length) * 100) : 0;
  const passed = score >= (test.passingScore || 60);
  const lowerScoreAttempts = await TestAttempt.countDocuments({ testId: test._id, score: { $lt: score } });
  const totalPreviousAttempts = await TestAttempt.countDocuments({ testId: test._id });
  const percentile = totalPreviousAttempts ? Math.round((lowerScoreAttempts / totalPreviousAttempts) * 100) : 100;
  const weakAreas = Object.entries(weakAreaMap)
    .sort((a, b) => b[1] - a[1])
    .map(([area]) => area);

  const topicBreakdown = Object.entries(topicMap).map(([topic, data]) => ({
    topic,
    correct: data.correct,
    total: data.total,
  }));

  const attempt = await TestAttempt.create({
    studentId: req.user._id,
    testId: test._id,
    testType: test.testType,
    companyId: test.companyId || null,
    score,
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    accuracy,
    percentile,
    passed,
    weakAreas,
    topicBreakdown,
    answers: detailedAnswers,
    markedForReview,
    timeTakenSeconds,
    autoSubmitted,
    startedAt: startedAt ? new Date(startedAt) : new Date(),
    submittedAt: new Date(),
  });

  const populated = await TestAttempt.findById(attempt._id).populate('testId', 'title testType');

  if (test.testType === 'company' && test.companyId) {
    const application = await Application.findOne({
      studentId: req.user._id,
      companyId: test.companyId._id || test.companyId,
    });
    if (application && passed && !['Selected', 'Rejected'].includes(application.status)) {
      application.status = 'Aptitude Cleared';
      application.currentRound = 'Technical Interview';
      await application.save();
    }
  }

  await Activity.create({
    studentId: req.user._id,
    testId: test._id,
    companyId: test.companyId?._id || test.companyId || null,
    type: 'test',
    status: passed ? 'Passed' : 'Needs Improvement',
    title: `Completed ${test.title}`,
    description: `Scored ${score}% with ${accuracy}% accuracy`,
    metadata: { attemptId: attempt._id, percentile },
  });

  await createNotification({
    role: 'admin',
    type: 'test',
    title: 'Test submitted',
    message: `${req.user.name} submitted ${test.title} with ${score}%`,
    link: '/admin/tests',
    metadata: { testId: test._id, attemptId: attempt._id },
  });

  res.status(201).json({
    attempt: populated,
    analytics: {
      score,
      correctAnswers,
      wrongAnswers,
      totalQuestions,
      accuracy,
      percentile,
      passed,
      weakAreas,
      topicBreakdown,
      timeTakenSeconds,
      autoSubmitted,
    },
  });
});

export const getMyTestAttempts = asyncHandler(async (req, res) => {
  const attempts = await TestAttempt.find({ studentId: req.user._id })
    .populate('testId', 'title testType duration')
    .populate('companyId', 'companyName')
    .sort({ createdAt: -1 });
  res.json(attempts);
});

export const getAttemptById = asyncHandler(async (req, res) => {
  const attempt = await TestAttempt.findOne({
    _id: req.params.attemptId,
    studentId: req.user._id,
  })
    .populate('testId', 'title questions testType duration')
    .populate('companyId', 'companyName');

  if (!attempt) {
    res.status(404);
    throw new Error('Attempt not found');
  }
  res.json(attempt);
});

export const getTestAnalytics = asyncHandler(async (req, res) => {
  const attempts = await TestAttempt.find({ studentId: req.user._id }).populate('testId', 'title testType');

  const categoryWeakness = {};
  attempts.forEach((attempt) => {
    attempt.weakAreas?.forEach((area) => {
      categoryWeakness[area] = (categoryWeakness[area] || 0) + 1;
    });
  });

  const avgScore = attempts.length
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
    : 0;

  res.json({
    totalAttempts: attempts.length,
    averageScore: avgScore,
    weakAreas: Object.entries(categoryWeakness)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count),
    recentScores: attempts.slice(0, 10).map((a) => ({
      score: a.score,
      date: a.createdAt,
      testTitle: a.testId?.title,
      testType: a.testType,
    })),
    topicBreakdown: attempts.flatMap((a) => a.topicBreakdown || []),
  });
});

// ─── Admin routes ─────────────────────────────────────────────────

export const adminGetTests = asyncHandler(async (req, res) => {
  const tests = await Test.find()
    .populate('companyId', 'companyName eligibility')
    .sort({ createdAt: -1 });

  const enrichedTests = await Promise.all(
    tests.map(async (test) => {
      const output = test.toObject();
      if (test.testType === 'company' && test.companyId) {
        output.eligibleStudentCount = await getEligibleStudentCount(test.companyId);
        output.eligibleStudentsPreview = await getEligibleStudentsPreview(test.companyId, 5);
      }
      return output;
    })
  );

  res.json(enrichedTests);
});

export const getEligibleStudentsForCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.companyId).select('companyName eligibility');
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }

  const count = await getEligibleStudentCount(company);
  const preview = await getEligibleStudentsPreview(company, 5);

  res.json({ companyId: company._id, companyName: company.companyName, count, preview });
});

// Check question availability before test creation
export const checkQuestionAvailability = asyncHandler(async (req, res) => {
  let { topicNames = [], difficulty = 'Mixed', numberOfQuestions = 0, bankSet } = req.query;

  // axios/querystring can send arrays either as repeated params or as a string.
  // Normalize topicNames to an array of strings.
  if (typeof topicNames === 'string') {
    topicNames = topicNames ? [topicNames] : [];
  } else if (!Array.isArray(topicNames)) {
    topicNames = [];
  }

  const requested = parseInt(numberOfQuestions, 10) || 0;

  console.log('[CHECK_AVAILABILITY] Checking for:', {
    topicNames: topicNames.length > 0 ? topicNames : 'all',
    difficulty,
    numberOfQuestions,
    bankSet,
  });

  const enabledSets = await QuestionBankSet.find({ enabled: true }).select('key');
  if (!enabledSets.length) {
    return res.json({
      available: 0,
      requested,
      isAvailable: false,
      message: 'No question bank sets are enabled. Please enable at least one set.',
    });
  }

  const bankSets = enabledSets.map((set) => set.key);
  const filter = { isActive: true, bankSet: { $in: bankSets } };

  // Only count unused questions for availability checks.
  filter.consumed = false;

  if (bankSet) {
    if (!bankSets.includes(bankSet)) {
      return res.status(400).json({
        available: 0,
        requested,
        isAvailable: false,
        message: `Requested bank set '${bankSet}' is not enabled or does not exist.`,
      });
    }
    filter.bankSet = bankSet;
  }

  if (topicNames.length > 0) {
    filter.topicName = { $in: topicNames };
  }

  if (difficulty && difficulty !== 'Mixed') {
    filter.difficulty = difficulty;
  }

  const availableCount = await QuestionBank.countDocuments(filter);
  const isAvailable = availableCount >= requested;

  console.log('[CHECK_AVAILABILITY] Result:', {
    available: availableCount,
    requested,
    isAvailable,
  });

  res.json({
    available: availableCount,
    requested,
    isAvailable,
    message: !isAvailable
      ? `Requested number of questions exceeds available unused questions in the Question Bank. Only ${availableCount} questions are available, but ${requested} were requested.`
      : `${availableCount} questions available`,
  });
});


export const createTest = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    duration,
    numberOfQuestions,
    topics,
    topicNames,
    difficulty,
    testType,
    companyId,
    companyTag,
    excludeQuestionBankIds = [],
    startsAt,
    endsAt,
    passingScore,
  } = req.body;

  console.log('[CREATE_TEST] Request received:', {
    title,
    duration,
    numberOfQuestions,
    topicNames,
    difficulty,
    testType,
    bankSet: req.body.bankSet,
    selectedTopicSet: req.body.bankSet,
    excludeQuestionBankIds: excludeQuestionBankIds.length,
  });

  // Validate required fields
  if (!title?.trim()) {
    res.status(400);
    throw new Error('Test title is required and cannot be empty');
  }

  if (!duration || duration < 1) {
    res.status(400);
    throw new Error('Test duration must be at least 1 minute');
  }

  if (!numberOfQuestions || numberOfQuestions < 1) {
    res.status(400);
    throw new Error('Number of questions must be at least 1');
  }

  if (!Number.isInteger(parseInt(numberOfQuestions, 10))) {
    res.status(400);
    throw new Error('Number of questions must be a whole number');
  }

  // Check for duplicate test title
  const existingTest = await Test.findOne({ title: title.trim() });
  if (existingTest) {
    res.status(400);
    throw new Error(`A test with title "${title}" already exists. Please use a different title.`);
  }

  // Validate company-specific test requirements
  if (testType === 'company') {
    if (!companyId) {
      res.status(400);
      throw new Error('Company is required for company-specific tests');
    }
  }

  let tag = companyTag;
  if (testType === 'company') {
    if (companyId && !tag) {
      const company = await Company.findById(companyId);
      if (!company) {
        res.status(400);
        throw new Error('Selected company not found in the system');
      }
      tag = company.companyName || 'General';
    }
  } else {
    tag = undefined;
  }

  // Get enabled bank sets or honor client-specified bankSet if valid
  let bankSets = [];
  const clientBankSet = req.body.bankSet;
  if (clientBankSet) {
    const setObj = await QuestionBankSet.findOne({ key: clientBankSet, enabled: true }).select('key');
    if (!setObj) {
      res.status(400);
      throw new Error(`Requested bank set '${clientBankSet}' is not enabled or does not exist`);
    }
    bankSets = [clientBankSet];
  } else {
    const enabledSets = await QuestionBankSet.find({ enabled: true }).select('key');
    if (!enabledSets.length) {
      res.status(400);
      throw new Error('No question bank sets are enabled. Please enable at least one set in Question Bank settings.');
    }
    bankSets = enabledSets.map((set) => set.key);
  }

  console.log('[CREATE_TEST] Enabled bank sets:', bankSets);
  console.log('[CREATE_TEST] Requesting question generation:', {
    numberOfQuestions: parseInt(numberOfQuestions, 10),
    topicNames,
    difficulty,
    companyTag: tag,
    testType,
  });

  const requested = parseInt(numberOfQuestions, 10);

  // Generate questions
  let questions;
  try {
    questions = await generateTestQuestions({
      numberOfQuestions: requested,
      topics: topics || [],
      topicNames: topicNames || [],
      difficulty: difficulty || 'Mixed',
      companyTag: tag,
      companyId,
      testType: testType || 'general',
      bankSets,
      excludeQuestionBankIds,
    });
    console.log('[CREATE_TEST] Questions generated successfully:', {
      requested,
      count: questions.length,
      topicNames: [...new Set(questions.map((q) => q.topicName))],
    });
  } catch (err) {
    console.error('[CREATE_TEST] Question generation failed:', err.message);
    if (
      err.message.includes('Not enough questions') ||
      err.message.includes('Not enough unique questions') ||
      err.message.includes('Failed to generate required number of questions') ||
      err.message.includes('Only')
    ) {
      res.status(400);
    }
    throw err;
  }

  // Validate generated questions
  if (!questions || !Array.isArray(questions)) {
    console.error('[CREATE_TEST] Invalid questions array returned');
    res.status(500);
    throw new Error('Question generation returned invalid data. Please try again.');
  }

  if (questions.length === 0) {
    res.status(400);
    throw new Error('No questions were generated. Check if your question bank has available questions for the selected criteria.');
  }

  if (questions.length !== requested) {
    res.status(400);
    throw new Error(`Only ${questions.length} questions are available, but ${requested} were requested.`);
  }

  console.log('[CREATE_TEST] Creating test record in database...');

  // Create test with error handling
  let test;
  try {
    test = await Test.create({
      title: title.trim(),
      description: description || '',
      duration: parseInt(duration, 10),
      numberOfQuestions: requested,
      topics: topics || [],
      difficulty: difficulty || 'Mixed',
      testType: testType || 'general',
      companyId: testType === 'company' ? companyId : null,
      allowedStudentIds: [],
      startsAt: startsAt || null,
      endsAt: endsAt || null,
      passingScore: passingScore ?? 60,
      topicName: questions[0]?.topicName || 'General',
      topicId: questions[0]?.topicId || 'TOPIC000',
      questions,
      createdBy: req.user._id,
    });

    // Persist question consumption so Question Bank UI shows remaining unused questions.
    await (await import('../models/QuestionBank.js')).default.updateMany(
      { _id: { $in: questions.map((q) => q.questionBankId) }, isActive: true },
      { $set: { consumed: true } }
    );
    console.log('[CREATE_TEST] Test created successfully:', { testId: test._id, questionsCount: questions.length });
  } catch (dbErr) {
    console.error('[CREATE_TEST] Database error:', dbErr.message);
    if (dbErr.code === 11000) {
      res.status(400);
      throw new Error('A test with this title already exists. Please use a different title.');
    }
    if (dbErr.name === 'ValidationError') {
      res.status(400);
      throw new Error(`Validation error: ${Object.values(dbErr.errors).map((e) => e.message).join(', ')}`);
    }
    throw new Error('Failed to save test to database. Please try again.');
  }

  await createNotification({
    role: testType === 'company' ? 'student' : 'all',
    type: 'test',
    title: 'New assessment published',
    message: `${test.title} is now available`,
    link: '/tests',
    metadata: { testId: test._id },
  });

  await notifyOnlineTestAssignment(test);

  res.status(201).json(test);
});

export const updateTest = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);
  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }

  const { isActive, title, description, startsAt, endsAt, passingScore } = req.body;
  if (isActive !== undefined) test.isActive = isActive;
  if (title) test.title = title;
  if (description !== undefined) test.description = description;
  if (startsAt !== undefined) test.startsAt = startsAt || null;
  if (endsAt !== undefined) test.endsAt = endsAt || null;
  if (passingScore !== undefined) test.passingScore = passingScore;

  await test.save();
  res.json(test);
});

export const deleteTest = asyncHandler(async (req, res) => {
  const test = await Test.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }
  res.json({ message: 'Test deactivated', test });
});

export const regenerateTestQuestions = asyncHandler(async (req, res) => {
  const test = await Test.findById(req.params.id);

  if (!test) {
    res.status(404);
    throw new Error('Test not found');
  }

  const currentTopicName = test.topicName || test.questions?.[0]?.topicName;
  const currentTopicId = test.topicId || test.questions?.[0]?.topicId;
  const currentBankSets = [...new Set(test.questions?.map((q) => q.bankSet).filter(Boolean) || [])];

  if (!currentTopicName) {
    res.status(400);
    throw new Error('Current test does not have a topic set for regeneration');
  }

  // Find enabled bank sets, then limit to only those that actually contain
  // questions for the current topic. This lets regeneration use other enabled
  // sets that include the same topic instead of strictly matching the
  // QuestionBankSet.topicName field.
  const enabledSetsAll = await QuestionBankSet.find({ enabled: true }).select('key');
  const enabledKeys = enabledSetsAll.map((s) => s.key);

  const matchingBankSets = await QuestionBank.distinct('bankSet', {
    isActive: true,
    topicName: new RegExp(`^${(currentTopicName || '').replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, 'i'),
    bankSet: { $in: enabledKeys },
  });

  if (!matchingBankSets.length) {
    res.status(400);
    throw new Error('No enabled question bank sets are available for this topic.');
  }

  const company = test.companyId ? await Company.findById(test.companyId) : null;
  const bankSets = matchingBankSets;
  const currentQuestionIds = test.questions?.map((q) => q.questionBankId).filter(Boolean) || [];

  let questions;
  try {
    questions = await generateTestQuestions({
      numberOfQuestions: test.numberOfQuestions,
      topics: test.topics || [],
      topicName: (!test.topics || test.topics.length === 0) ? currentTopicName : undefined,
      difficulty: test.difficulty,
      companyTag: company?.companyName,
      companyId: test.companyId,
      testType: test.testType,
      bankSets,
      excludeQuestionBankIds: currentQuestionIds,
    });
  } catch (err) {
    // Hard fail: regeneration must not create incomplete question sets.
    res.status(400);
    throw new Error(err.message || 'Failed to regenerate questions with requested count');
  }

  if (!questions || questions.length !== test.numberOfQuestions) {
    res.status(400);
    throw new Error(`Regeneration failed: expected ${test.numberOfQuestions} questions but got ${questions?.length || 0}.`);
  }

  test.questions = questions;

  // Mark newly used questions as consumed.
  await import('../models/QuestionBank.js').then(async ({ default: QuestionBank }) => {
    await QuestionBank.updateMany(
      { _id: { $in: (questions || []).map((q) => q.questionBankId) }, isActive: true },
      { $set: { consumed: true } }
    );
  });


  test.topicName = currentTopicName;

  test.topicId = currentTopicId;
  await test.save();
  res.json(test);
});

export const getStudentsForAssignment = asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student' }).select('name email branch cgpa');
  res.json(students);
});
