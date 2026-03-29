import express, { Application, Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { globalLimiter } from './middlewares/rateLimiter';
import http from 'http';
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

// ---------- HTTP Server (hosting platforms like Render handle SSL at edge) ----------
const server = http.createServer(app);

// ---------- Initialize Socket.IO ----------
initSocket(server);

// ---------- Middlewares ----------
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:"],
      imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://images.unsplash.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "data:"],
      mediaSrc: ["'self'", "blob:"],
    },
  },
}));
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

// ---------- Serve Frontend (production) ----------
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('{*path}', (req: Request, res: Response) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
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

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server (API + Socket.IO) running on http://0.0.0.0:${PORT}`);
  });

  process.on('unhandledRejection', (err: Error) => {
    console.error('Unhandled Rejection:', err.message);
    server.close(() => process.exit(1));
  });
};

startServer();

export { app, server };
