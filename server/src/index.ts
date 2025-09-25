import express from 'express';
import cors from 'cors';
import { PORT } from './config';
import authRoutes from './routes/auth';
import budgetRoutes from './routes/budget';
import simulationsRoutes from './routes/simulations';
import communesRoutes from './routes/communes';
import usersRoutes from './routes/users';

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(/[,\s]+/).filter(Boolean)
  : undefined;

app.use(
  cors({
    origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/simulations', simulationsRoutes);
app.use('/api/communes', communesRoutes);
app.use('/api/users', usersRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});

export default app;
