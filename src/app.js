
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import orchestratorRoutes from './routes/orchestratorRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

// Security
app.disable('x-powered-by');
app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        env.corsOrigins.includes('*') ||
        env.corsOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true
  })
);

// Request parsing and logging
app.use(express.json({ limit: '1mb' }));

app.use(
  morgan(env.nodeEnv === 'production' ? 'combined' : 'dev')
);

// API rate limiting
app.use(
  '/api',
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false
  })
);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    service: 'career-orchestrator-api',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Authentication routes
app.use('/api/v1/auth', authRoutes);

// Career Orchestrator routes
app.use('/api/v1/orchestrator', orchestratorRoutes);

// Service-to-service integration (MeritLens)
app.use('/api/v1/integration', integrationRoutes);

// Error handling MUST come after all application routes
app.use(notFound);
app.use(errorHandler);

export default app;
