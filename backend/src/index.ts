import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import * as path from 'node:path';
import playerRoutes from './routes/playerRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
}));
app.use(express.json());

// Serve downloaded video/thumbnail files as static assets
const mediaDir = path.resolve(import.meta.dirname, '../data/videos');
app.use('/media', express.static(mediaDir, {
  setHeaders: (res, filePath) => {
    // Enable range requests for video seeking
    if (filePath.endsWith('.mp4')) {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', 'video/mp4');
    }
  },
}));

// API Routes
app.use('/api', playerRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 100LS Backend running on http://localhost:${PORT}`);
  console.log(`   API: POST http://localhost:${PORT}/api/videos — import video`);
  console.log(`   API: GET  http://localhost:${PORT}/api/videos — list videos`);
  console.log(`   API: GET  http://localhost:${PORT}/api/player/:videoId — player data`);
  console.log(`   Media: http://localhost:${PORT}/media/:videoId/video.mp4`);
});
