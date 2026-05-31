import mongoose from 'mongoose';
import QuestionBank from './models/QuestionBank.js';
import QuestionBankSet from './models/QuestionBankSet.js';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/smartplacement_db';

const run = async () => {
  await mongoose.connect(uri);
  const topicNames = ['VERBAL'];
  const difficulty = 'Mixed';
  const numberOfQuestions = 4;
  const bankSet = undefined; // set specific or undefined

  console.log('Debug availability check for', { topicNames, difficulty, numberOfQuestions, bankSet });

  const enabledSets = await QuestionBankSet.find({ enabled: true }).select('key');
  console.log('Enabled sets:', enabledSets.map(s => s.key));
  if (!enabledSets.length) {
    console.log('No enabled sets');
    process.exit(0);
  }
  const bankSets = enabledSets.map(s => s.key);

  const filter = { isActive: true, bankSet: { $in: bankSets } };
  if (bankSet) {
    if (!bankSets.includes(bankSet)) {
      console.log('Requested bankSet is not enabled');
      process.exit(0);
    }
    filter.bankSet = bankSet;
  }

  if (topicNames.length > 0) filter.topicName = { $in: topicNames };
  if (difficulty && difficulty !== 'Mixed') filter.difficulty = difficulty;

  const availableCount = await QuestionBank.countDocuments(filter);
  console.log('Available count by replicated route filter:', availableCount);

  // Also show the raw pool used by generator (no companyTag unless company test)
  const pool = await QuestionBank.find(filter).lean();
  console.log('Sample pool items (first 10):', pool.slice(0, 10).map(p => ({ _id: p._id.toString(), topicName: p.topicName, bankSet: p.bankSet, companyTag: p.companyTag })));

  process.exit(0);
};

run().catch(e => { console.error(e); process.exit(1); });
