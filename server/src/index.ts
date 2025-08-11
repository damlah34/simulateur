import express from 'express';
import cors from 'cors';
import communes from './routes/communes';
import prix from './routes/prix';
import { PORT } from './config';

const app = express();
app.use(cors());

app.use('/api/communes', communes);
app.use('/api/prix-m2', prix);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
