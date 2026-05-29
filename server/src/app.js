import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './utils/config.js';

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

// TODO: Mount routes here as they are built
// app.use('/api', uploadRouter);
// app.use('/api', scrapeRouter);
// app.use('/api', chatRouter);
// app.use('/api', sourcesRouter);

// Global error handler — generic message to client, detailed log for devs
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    error: 'Something went wrong. Please try again.',
  });
});

export default app;
