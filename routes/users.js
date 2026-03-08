import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../database/db.js';

const router = Router();

// Register or retrieve a named session user
router.post('/session', async (req, res) => {
  const { name, session_token } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  // If client already has a token, look them up
  if (session_token) {
    const [rows] = await pool.query(
      'SELECT id, name, session_token FROM users WHERE session_token = ?',
      [session_token]
    );
    if (rows.length) {
      await pool.query('UPDATE users SET last_seen = NOW() WHERE id = ?', [rows[0].id]);
      return res.json(rows[0]);
    }
  }

  // Create new user
  const token = uuidv4();
  const [result] = await pool.query(
    'INSERT INTO users (name, session_token) VALUES (?, ?)',
    [name.trim(), token]
  );

  res.status(201).json({ id: result.insertId, name: name.trim(), session_token: token });
});

export default router;
