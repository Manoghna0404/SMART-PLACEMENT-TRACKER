import QuestionBank from '../models/QuestionBank.js';

export const generateTestQuestions = async ({
  numberOfQuestions,
  topics = [],
  topicNames = [],
  topicIds = [],
  difficulty = 'Mixed',
  companyTag,
  companyId,
  testType,
  bankSets,
  topicName,
  topicId,
  excludeQuestionBankIds = [],
}) => {
  const filter = { isActive: true, consumed: false };

  if (topics.length > 0) {
    filter.topic = { $in: topics };
  }

  if (topicNames.length > 0) {
    filter.topicName = { $in: topicNames };
  } else if (topicName) {
    filter.topicName = topicName;
  }

  if (topicIds.length > 0) {
    filter.topicId = { $in: topicIds };
  } else if (topicId) {
    filter.topicId = topicId;
  }

  if (difficulty && difficulty !== 'Mixed') {
    filter.difficulty = difficulty;
  }

  if (bankSets?.length) {
    filter.bankSet = { $in: bankSets };
  }

  // NOTE: Do not re-override topicName/topicId here.
  // We must keep a single consistent precedence rule (e.g., topicNames has priority over topicName).
  // Re-applying these conditions can accidentally override a $in filter and lead to 0 matches.

  if (topicId) {
    filter.topicId = topicId;
  }

  // Debug what exact values we are trying to match. This helps identify cases like
  // topicName casing mismatches (e.g., VERBAL vs Verbal) or wrong bankSet selection.
  console.log('[TEST_GENERATOR] Match values:', {
    numberOfQuestions,
    topicNames,
    topicName,
    topicIds,
    topicId,
    difficulty,
    bankSets,
    testType,
    companyTag,
  });

  if (testType === 'company' && companyTag) {

    filter.$or = [{ companyTag }, { companyTag: 'General' }];
  } else {
    // General tests should use the full bank regardless of question company tags.
    if (companyTag) {
      console.log('[TEST_GENERATOR] Ignoring companyTag for general tests:', { companyTag });
    }
  }

  console.log('[TEST_GENERATOR] Question pool filter:', { filter });
  const pool = await QuestionBank.find(filter);

  if (!pool || pool.length === 0) {
    console.log('[TEST_GENERATOR] Pool is empty. Topics:', topicNames, 'bankSets:', bankSets);
    throw new Error(
      `No questions found for selected ${topicNames?.length ? 'topics: ' + topicNames.join(', ') : 'topic'}. Available questions in bank: 0. Please check your question bank or try different criteria.`
    );
  }

  if (numberOfQuestions < 1) {
    throw new Error('Requested number of questions must be at least 1.');
  }

  if (pool.length < numberOfQuestions) {
    console.log('[TEST_GENERATOR] Insufficient questions:', { poolSize: pool.length, requested: numberOfQuestions });
    throw new Error(
      `Requested number of questions exceeds available questions in the Question Bank. Only ${pool.length} questions are available, but ${numberOfQuestions} were requested.`
    );
  }

  const byId = new Map();
  pool.forEach((q) => {
    if (!byId.has(String(q._id))) byId.set(String(q._id), q);
  });

  const uniquePool = [...byId.values()];
  console.log('[TEST_GENERATOR] Unique pool size:', uniquePool.length);

  if (uniquePool.length < numberOfQuestions) {
    throw new Error(
      `Requested number of questions exceeds available questions in the Question Bank after deduplication. Only ${uniquePool.length} unique questions are available, but ${numberOfQuestions} were requested.`
    );
  }

  const excluded = new Set(excludeQuestionBankIds.map(String));
  const available = uniquePool.filter((q) => !excluded.has(String(q._id)));
  console.log('[TEST_GENERATOR] Available questions after exclusion:', {
    totalExcluded: excluded.size,
    availableCount: available.length,
  });

  if (available.length < numberOfQuestions) {
    throw new Error(
      `Requested number of questions exceeds available unused questions in the Question Bank. Only ${available.length} questions are available, but ${numberOfQuestions} were requested.`
    );
  }

  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const result = [];
  const selectedIds = new Set();
  for (const q of shuffled) {
    if (result.length >= numberOfQuestions) break;
    const idStr = String(q._id);
    if (selectedIds.has(idStr)) continue;
    selectedIds.add(idStr);
    result.push({
      questionBankId: q._id,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      topic: q.topic,
      difficulty: q.difficulty,
      companyTag: q.companyTag,
      bankSet: q.bankSet,
      topicName: q.topicName,
      topicId: q.topicId,
    });
  }

  if (result.length !== numberOfQuestions) {
    console.error('[TEST_GENERATOR] Final count mismatch:', { returned: result.length, requested: numberOfQuestions });
    throw new Error(`Failed to generate required number of questions. Requested ${numberOfQuestions}, got ${result.length}.`);
  }

  console.log('[TEST_GENERATOR] Test generation complete:', { totalQuestions: result.length });
  return result;
};
