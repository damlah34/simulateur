import express from 'express';
import cors from 'cors';
import communes from './routes/communes';
import prix from './routes/prix';
import auth from './routes/auth';
import { PORT } from './config';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/communes', communes);
app.use('/api/prix-m2', prix);
app.use('/api/auth', auth);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
