import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { getDbAdapter } from './src/server/db';
import authRoutes from './src/server/routes/authRoutes';
import trainerRoutes from './src/server/routes/trainerRoutes';
import clientRoutes from './src/server/routes/clientRoutes';
import foodRoutes from './src/server/routes/foodRoutes';
import visionRoutes from './src/server/routes/visionRoutes';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProd = process.env.NODE_ENV === 'production';

  // Body parsers with generous limits for video frame snapshots (base64)
  app.use(express.json({ limit: '40mb' }));
  app.use(express.urlencoded({ extended: true, limit: '40mb' }));

  // Ensure uploads directory exists and is served statically
  const uploadsDir = path.resolve(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Initialize DB adapter (SQLite or Oracle depending on ORDS_BASE_URL)
  try {
    await getDbAdapter();
    console.log('[Server] Database adapter initialized successfully');
  } catch (err) {
    console.error('[Server] Database initialization failed:', err);
    process.exit(1);
  }

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/trainer', trainerRoutes);
  app.use('/api/client', clientRoutes);
  app.use('/api/foods', foodRoutes);
  app.use('/api', visionRoutes);
  app.use('/api/vision', visionRoutes);

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'FlexiFit Uganda',
      mode: process.env.ORDS_BASE_URL ? 'oracle-ords' : 'sqlite-local',
      time: new Date().toISOString(),
    });
  });

  if (!isProd) {
    // Development mode: Mount Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static frontend
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FlexiFit] Server running on http://0.0.0.0:${PORT} in ${isProd ? 'production' : 'development'} mode`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
