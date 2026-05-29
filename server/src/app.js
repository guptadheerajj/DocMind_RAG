import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './utils/config.js';
import { AppError } from './utils/response.js';
import uploadRouter from './routes/upload.js';
import scrapeRouter from './routes/scrape.js';
import chatRouter from './routes/chat.js';
import sourcesRouter from './routes/sources.js';

const app = express();

// Security headers
app.use(helmet());

// CORS — restrict to frontend origin
app.use(
  cors({
    origin: config.clientUrl,
    methods: ['GET', 'POST', 'DELETE'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', uploadRouter);
app.use('/api', scrapeRouter);
app.use('/api', chatRouter);
app.use('/api', sourcesRouter);

// Global error handler
// AppError  → controlled error, send the message + status to the client
// Other     → unexpected crash, log details, send generic 500 to client
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.status).json({ success: false, error: err.message });
  }
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
});

export default app;
