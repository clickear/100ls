import express from 'express';
import cors from 'cors';
import playerRoutes from './routes/playerRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'] }));
app.use(express.json());

// Routes
app.use('/api', playerRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 100LS Backend running on http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/player/sunset-001`);
});
