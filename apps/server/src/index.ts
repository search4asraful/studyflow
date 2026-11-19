import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { prisma } from './config/prisma';
import { apiRouter } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { setupSocketServer } from './sockets/socketServer';
import { TimerService } from './services/timerService';

const app = express();
const server = http.createServer(app);

// Enable trust proxy for Render / reverse proxies (needed for secure cookies)
app.set('trust proxy', 1);

// Cross-Origin Resource Sharing
const allowedOrigins = [
  env.FRONTEND_URL.replace(/\/$/, ''),
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (
        allowedOrigins.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Standard Middlewares
app.use(cookieParser(env.COOKIE_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root & Health Check Endpoints (for Render health checks and probes)
app.get('/', (_req, res) => {
  res.status(200).json({ name: 'StudyFlow API', status: 'online' });
});
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', apiRouter);

// Centralized Error Handler
app.use(errorHandler);

// Setup Real-Time WebSockets
setupSocketServer(server);

// Boot sequence
async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('📦 Connected to PostgreSQL database');

    // Restore timer states from database
    await TimerService.initializeFromDatabase();

    server.listen(env.PORT, () => {
      console.log(`🚀 StudyFlow Server listening on port ${env.PORT} [${env.NODE_ENV}]`);
    });
  } catch (error) {
    console.error('Fatal initialization error:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('HTTP server closed, database disconnected');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('HTTP server closed, database disconnected');
    process.exit(0);
  });
});

bootstrap();
