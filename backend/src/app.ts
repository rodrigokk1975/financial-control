import cors from 'cors';
import express from 'express';
import { env } from './config/env';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    })
  );
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'financial-control-api',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

export const app = createApp();
