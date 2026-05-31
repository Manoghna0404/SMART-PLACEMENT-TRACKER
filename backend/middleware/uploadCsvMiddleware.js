import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = 'uploads/questions';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    cb(null, `questions-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  if (
    allowed.includes(file.mimetype) ||
    ['.csv', '.xlsx', '.xls'].includes(ext)
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV or Excel files are allowed'), false);
  }
};

export const uploadQuestions = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
