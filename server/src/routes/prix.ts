import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { getPrices } from '../services/dvf';
import { pool } from '../db/pool';

const router = Router();
const limiter = rateLimit({ windowMs: 1000, max: 5 });

router.get('/', limiter, async (req, res) => {
  const schema = z.object({ insee: z.string().length(5) });
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Paramètre invalide' });
  }
  try {
    const data = await getPrices(pool, parsed.data.insee);
    res.json(data);
  } catch (e: any) {
    if (e.message === 'Échantillon insuffisant') {
      res.status(404).json({ error: e.message });
    } else {
      res.status(500).json({ error: 'Erreur interne' });
    }
  }
});

export default router;
