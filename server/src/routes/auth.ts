import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { pool } from '../db/pool';

const router = Router();

router.post('/register', async (req, res) => {
  const schema = z.object({
    firstName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Paramètres invalides' });
  }
  const { firstName, email, password } = parsed.data;
  const client = await pool.connect();
  try {
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(409).json({ error: 'Email déjà utilisé' });
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    const combined = `${salt}:${hash}`;
    const result = await client.query(
      'INSERT INTO users(first_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, first_name, email',
      [firstName, email, combined],
    );
    const user = result.rows[0];
    res.json({ id: user.id, firstName: user.first_name, email: user.email });
  } finally {
    client.release();
  }
});

router.post('/login', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Paramètres invalides' });
  }
  const { email, password } = parsed.data;
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id, first_name, email, password_hash FROM users WHERE email = $1',
      [email],
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    const user = result.rows[0];
    const [salt, storedHash] = user.password_hash.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    if (hash !== storedHash) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    res.json({ id: user.id, firstName: user.first_name, email: user.email });
  } finally {
    client.release();
  }
});

export default router;
