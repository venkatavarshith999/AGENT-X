import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './auth';
import { casesRouter } from './cases';
import { dispatchRouter } from './dispatch';
import { initRealtime } from './realtime';
import { seedDatabase } from './seed';
import { db } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/auth', authRouter);
app.use('/cases', casesRouter);
app.use('/api', dispatchRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = http.createServer(app);
initRealtime(server);

async function main() {
  try {
    // Check if database has users, if not seed it automatically
    const userCount = await db.user.count();
    if (userCount === 0) {
      console.log('[Server] Database is empty. Running auto-seed...');
      await seedDatabase();
    }

    server.listen(PORT, () => {
      console.log(`[Agent X API Server] Running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Failed to initialize:', err);
  }
}

main();
