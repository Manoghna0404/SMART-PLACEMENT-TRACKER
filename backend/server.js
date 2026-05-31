import dotenv from 'dotenv';
dotenv.config();
if (!process.env.JWT_SECRET) {
  console.error('Missing required JWT_SECRET in environment variables.');
  process.exit(1);
}
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import http from 'http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import User from './models/User.js';
import authRoutes from './routes/authRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import testRoutes from './routes/testRoutes.js';
import questionBankRoutes from './routes/questionBankRoutes.js';
import interviewRoutes from './routes/interviewRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { errorHandler } from './middleware/errorMiddleware.js';
import { initRealtime } from './utils/realtime.js';

dotenv.config();
connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const rateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});
app.use(rateLimiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Smart Placement Tracker API' }));

app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/question-bank', questionBankRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;

const startServer = async () => {
  const port = DEFAULT_PORT;
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });


  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('role');
      socket.user = { id: decoded.id, role: user?.role };
    } catch (error) {
      return next(new Error('Invalid socket token'));
    }
    next();
  });

  io.on('connection', (socket) => {
    if (socket.user?.id) socket.join(`user:${socket.user.id}`);
    if (socket.user?.role) socket.join(`role:${socket.user.role}`);
    socket.emit('socket:ready', { connected: true });
  });

  initRealtime(io);

  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `Port ${port} is already in use. Please stop the process using it or set PORT to an available port before starting the backend.`
      );
    } else {
      console.error('Server error:', error);
    }
    process.exit(1);
  });

  process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    server.close(() => process.exit(0));
  });
};
// console.log(process.env.SMTP_HOST);
// console.log(process.env.SMTP_PORT);
startServer();
