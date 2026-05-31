import fs from 'fs';
import csv from 'csv-parser';
import XLSX from 'xlsx';

const normalizeKey = (key) =>
  String(key || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/_/g, '');

const parseCorrectAnswer = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const v = String(value).trim().toUpperCase();
  const map = { A: 0, B: 1, C: 2, D: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
  if (map[v] !== undefined) return map[v];
  const num = parseInt(v, 10);
  if (!Number.isNaN(num) && num >= 0 && num <= 3) return num;
  return null;
};

const rowToQuestion = (row, rowNum) => {
  const normalized = {};
  Object.entries(row).forEach(([k, v]) => {
    normalized[normalizeKey(k)] = typeof v === 'string' ? v.trim() : v;
  });

  const questionText =
    normalized.question ||
    normalized.questiontext ||
    normalized['question text'] ||
    '';

  const options = [
    normalized.optiona || normalized.a || normalized['option 1'] || '',
    normalized.optionb || normalized.b || normalized['option 2'] || '',
    normalized.optionc || normalized.c || normalized['option 3'] || '',
    normalized.optiond || normalized.d || normalized['option 4'] || '',
  ].map((o) => String(o).trim());

  const correctAnswer = parseCorrectAnswer(
    normalized.correctanswer || normalized.answer || normalized.correct
  );

  const topic = normalized.topic || normalized.category || 'General';
  const difficulty = normalized.difficulty || 'Medium';
  const companyTag = normalized.companytag || normalized.company || 'General';

  const errors = [];
  if (!questionText) errors.push('missing question text');
  if (options.some((o) => !o)) errors.push('missing options');
  if (correctAnswer === null) errors.push('invalid correct answer');

  const diff = ['Easy', 'Medium', 'Hard'].includes(
    String(difficulty).charAt(0).toUpperCase() + String(difficulty).slice(1).toLowerCase()
  )
    ? String(difficulty).charAt(0).toUpperCase() + String(difficulty).slice(1).toLowerCase()
    : difficulty === 'easy'
      ? 'Easy'
      : difficulty === 'hard'
        ? 'Hard'
        : 'Medium';

  if (errors.length) {
    return { error: `Row ${rowNum}: ${errors.join(', ')}` };
  }

  return {
    questionText,
    options,
    correctAnswer,
    topic: String(topic).trim(),
    difficulty: diff,
    companyTag: String(companyTag).trim() || 'General',
  };
};

export const parseCsvFile = (filePath) =>
  new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let rowNum = 1;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rowNum++;
        const parsed = rowToQuestion(row, rowNum);
        if (parsed.error) errors.push(parsed.error);
        else results.push(parsed);
      })
      .on('end', () => resolve({ questions: results, errors }))
      .on('error', reject);
  });

export const parseExcelFile = (filePath) => {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  const questions = [];
  const errors = [];

  rows.forEach((row, idx) => {
    const parsed = rowToQuestion(row, idx + 2);
    if (parsed.error) errors.push(parsed.error);
    else questions.push(parsed);
  });

  return { questions, errors };
};

export const parseQuestionFile = async (filePath, mimetype) => {
  if (
    mimetype === 'text/csv' ||
    filePath.endsWith('.csv')
  ) {
    return parseCsvFile(filePath);
  }
  return parseExcelFile(filePath);
};
