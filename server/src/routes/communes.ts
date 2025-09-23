import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { searchCommunes } from '../services/geo';

const router = Router();
const limiter = rateLimit({ windowMs: 1000, max: 10 });

router.get('/search', limiter, async (req, res) => {
  const schema = z.object({ q: z.string().min(1) });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Paramètre invalide' });
  }
  try {
    const data = await searchCommunes(parsed.data.q);
    res.json(data);
  } catch {
    res.status(502).json({ error: 'API communes indisponible' });
  }
});

export default router;
