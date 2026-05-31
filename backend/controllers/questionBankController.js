import fs from 'fs';
import QuestionBank from '../models/QuestionBank.js';
import QuestionBankSet from '../models/QuestionBankSet.js';
import { parseQuestionFile } from '../utils/csvQuestionParser.js';
import { asyncHandler } from '../middleware/errorMiddleware.js';

export const getQuestions = asyncHandler(async (req, res) => {
  const { topic, topicName, difficulty, companyTag, bankSet, search, page = 1, limit = 50 } = req.query;
  // Only return unused questions to keep Question Bank UI synchronized.
  const filter = { isActive: true, consumed: false };

  if (topic) filter.topic = topic;
  if (topicName) filter.topicName = new RegExp(topicName, 'i');
  if (difficulty) filter.difficulty = difficulty;
  if (companyTag) filter.companyTag = new RegExp(companyTag, 'i');
  if (bankSet) filter.bankSet = bankSet;
  if (search) filter.questionText = new RegExp(search, 'i');


  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const [questions, total] = await Promise.all([
    QuestionBank.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
    QuestionBank.countDocuments(filter),
  ]);

  res.json({ questions, total, page: parseInt(page, 10), pages: Math.ceil(total / parseInt(limit, 10)) });
});

const BANK_SETS = ['set1', 'set2', 'set3'];

const normalizeTopicName = (topicName) => topicName.trim().replace(/\s+/g, ' ');

const escapeRegex = (input) => input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getNextTopicId = async () => {
  const topicIds = await QuestionBankSet.distinct('topicId', { topicId: { $regex: /^TOPIC\d{3}$/ } });
  const maxNumber = topicIds.reduce((max, id) => {
    const num = parseInt(id.replace('TOPIC', ''), 10);
    return Number.isFinite(num) && num > max ? num : max;
  }, 0);
  return `TOPIC${String(maxNumber + 1).padStart(3, '0')}`;
};

const findOrCreateTopicId = async (topicName) => {
  const existing = await QuestionBankSet.findOne({ topicName: new RegExp(`^${escapeRegex(topicName)}$`, 'i') });
  if (existing && existing.topicId) return existing.topicId;
  return getNextTopicId();
};

const getOrCreateDefaultBankSets = async () => {
  const sets = await QuestionBankSet.find().sort({ key: 1 });
  if (sets.length === BANK_SETS.length) return sets;
  const missing = BANK_SETS.filter((key) => !sets.some((s) => s.key === key));
  if (missing.length > 0) {
    const inserts = missing.map((key, idx) => ({
      key,
      name: `Question Bank Set ${key.replace('set', '')}`,
      enabled: key === 'set1',
      topicName: '',
      topicId: '',
      fileName: '',
    }));
    await QuestionBankSet.insertMany(inserts, { ordered: false }).catch(() => {});
  }
  return QuestionBankSet.find().sort({ key: 1 });
};

export const getBankSets = asyncHandler(async (req, res) => {
  const sets = await getOrCreateDefaultBankSets();
  res.json(sets);
});

export const updateBankSet = asyncHandler(async (req, res) => {
  const { enabled, topicName } = req.body;
  const key = req.params.key;
  if (!BANK_SETS.includes(key)) {
    res.status(400);
    throw new Error('Invalid bank set');
  }

  const update = {};
  if (enabled !== undefined) update.enabled = Boolean(enabled);
  if (typeof topicName === 'string') {
    const normalizedTopicName = normalizeTopicName(topicName);
    if (!normalizedTopicName) {
      res.status(400);
      throw new Error('Topic name cannot be empty');
    }
    update.topicName = normalizedTopicName;
    update.topicId = await findOrCreateTopicId(normalizedTopicName);
  }

  const set = await QuestionBankSet.findOneAndUpdate({ key }, update, { new: true });
  if (!set) {
    res.status(404);
    throw new Error('Question Bank set not found');
  }
  res.json(set);
});

export const getQuestionMeta = asyncHandler(async (req, res) => {
  const [topics, topicNames, difficulties, companyTags, total, countsByBankSet, topicSummary] = await Promise.all([
    QuestionBank.distinct('topic', { isActive: true, consumed: false }),
    QuestionBank.distinct('topicName', { isActive: true, consumed: false }),
    QuestionBank.distinct('difficulty', { isActive: true, consumed: false }),
    QuestionBank.distinct('companyTag', { isActive: true, consumed: false }),
    QuestionBank.countDocuments({ isActive: true, consumed: false }),

    QuestionBank.aggregate([
      { $match: { isActive: true, consumed: false } },
      { $group: { _id: '$bankSet', count: { $sum: 1 } } },
    ]),
    QuestionBank.aggregate([
      { $match: { isActive: true, consumed: false, topicName: { $exists: true, $ne: '' } } },

      { $group: { _id: { topicName: '$topicName', topicId: '$topicId', bankSet: '$bankSet' }, count: { $sum: 1 } } },
      { $group: { _id: { topicName: '$_id.topicName', topicId: '$_id.topicId' }, totalQuestions: { $sum: '$count' }, bankSets: { $push: { bankSet: '$_id.bankSet', count: '$count' } } } },
      { $project: { _id: 0, topicName: '$_id.topicName', topicId: '$_id.topicId', totalQuestions: 1, setsCount: { $size: '$bankSets' }, bankSets: 1 } },
      { $sort: { topicName: 1 } },
    ]),
  ]);

  const counts = countsByBankSet.reduce((acc, item) => {
    acc[item._id] = item.count;
    return acc;
  }, {});

  const sets = await getOrCreateDefaultBankSets();
  const setStatus = sets.reduce((acc, item) => {
    acc[item.key] = {
      enabled: item.enabled,
      name: item.name,
      topicName: item.topicName,
      topicId: item.topicId,
      fileName: item.fileName,
    };
    return acc;
  }, {});

  res.json({ topics, topicNames, difficulties, companyTags, total, countsByBankSet: counts, setStatus, topicSummary });
});

export const createQuestion = asyncHandler(async (req, res) => {
  const question = await QuestionBank.create({
    ...req.body,
    createdBy: req.user._id,
  });
  res.status(201).json(question);
});

export const uploadQuestions = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a CSV or Excel file');
  }

  const bankSet = req.query.set || 'set1';
  if (!BANK_SETS.includes(bankSet)) {
    fs.unlinkSync(req.file.path);
    res.status(400);
    throw new Error('Invalid question bank set');
  }

  const topicName = normalizeTopicName(req.body.topicName || '');
  if (!topicName) {
    fs.unlinkSync(req.file.path);
    res.status(400);
    throw new Error('Topic name is required for this upload');
  }

  const topicId = await findOrCreateTopicId(topicName);

  const { questions, errors } = await parseQuestionFile(req.file.path, req.file.mimetype);

  if (!questions.length) {
    fs.unlinkSync(req.file.path);
    res.status(400);
    throw new Error(errors.length ? errors.join('; ') : 'No valid questions found in file');
  }

  const setNumber = bankSet === 'set1' ? 1 : bankSet === 'set2' ? 2 : 3;
  const docs = questions.map((q) => ({
    ...q,
    createdBy: req.user._id,
    bankSet,
    setNumber,
    topicName,
    topicId,
  }));
  const inserted = await QuestionBank.insertMany(docs, { ordered: false });

  await QuestionBankSet.findOneAndUpdate(
    { key: bankSet },
    {
      enabled: true,
      topicName,
      topicId,
      fileName: req.file.originalname,
    },
    { new: true }
  );

  fs.unlinkSync(req.file.path);

  res.status(201).json({
    message: `${inserted.length} questions uploaded successfully to ${bankSet}`,
    inserted: inserted.length,
    bankSet,
    topicName,
    topicId,
    skipped: errors.length,
    errors: errors.slice(0, 20),
  });
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = await QuestionBank.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!question) {
    res.status(404);
    throw new Error('Question not found');
  }
  res.json({ message: 'Question removed from bank' });
});

export const downloadTemplate = asyncHandler(async (req, res) => {
  const csv = `question,optionA,optionB,optionC,optionD,correctAnswer,topic,difficulty,companyTag
What is 25% of 200?,25,50,75,100,B,Quantitative,Easy,General
Time complexity of binary search?,O(n),O(log n),O(n^2),O(1),B,DSA,Medium,TCS
Which is a NoSQL database?,MySQL,PostgreSQL,MongoDB,Oracle,C,Technical,Easy,Infosys`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=question-bank-template.csv');
  res.send(csv);
});
