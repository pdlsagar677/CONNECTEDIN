import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { globalLimiter } from './middlewares/rateLimiter';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

import connectDB from './utils/db';
import userRoute from './routes/user-route';
import postRoute from './routes/post-route';
import messageRoute from './routes/message-route';
import notificationRoute from './routes/notification-route';
import storyRoute from './routes/story-route';
import { initSocket } from './socket/socket';

dotenv.config();

const app: Application = express();
const PORT = Number(process.env.PORT) || 5000;

// ---------- HTTPS/HTTP Server ----------
const certPath = path.resolve(__dirname, '../../certs/cert.pem');
const keyPath = path.resolve(__dirname, '../../certs/key.pem');
const useHttps = fs.existsSync(certPath) && fs.existsSync(keyPath);

const server = useHttps
  ? https.createServer({ cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) }, app)
  : http.createServer(app);

// ---------- Initialize Socket.IO ----------
initSocket(server);

// ---------- Middlewares ----------
app.use(helmet());
app.use(compression());

const allowedOrigins = process.env.FRONTEND_URL?.split(',').map(s => s.trim()) || ['http://localhost:5173'];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(globalLimiter);

// ---------- API Routes ----------
app.use('/api/users', userRoute);
app.use('/api/post', postRoute);
app.use('/api/message', messageRoute);
app.use('/api/notifications', notificationRoute);
app.use('/api/stories', storyRoute);

// ---------- 404 Handler ----------
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// ---------- Error Handler ----------
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// ---------- Start Server ----------
const startServer = async () => {
  const isDbConnected = await connectDB();
  if (!isDbConnected) {
    console.error('Failed to connect to MongoDB');
    process.exit(1);
  }
  console.log('MongoDB connected successfully');

  const protocol = useHttps ? 'https' : 'http';
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server (API + Socket.IO) running on ${protocol}://0.0.0.0:${PORT}`);
  });

  process.on('unhandledRejection', (err: Error) => {
    console.error('Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
  });
};

startServer();

export { app, server };
