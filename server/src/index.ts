import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { env } from './config/env';
import { pool } from './config/db';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import apiRoutes from './routes';
import { initSocketServer } from './sockets';
import { start_recurring_events_job } from './jobs/recurring-events.job';

const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const httpServer = createServer(app);
initSocketServer(httpServer);

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connected successfully');

    start_recurring_events_job();

    httpServer.listen(env.port, () => {
      console.log(`GigSync API listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

startServer();