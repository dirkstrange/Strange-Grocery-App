import { Router } from 'express';
import pool from '../database/db.js';

const router = Router();

// Get active trip (creates one if none exists)
router.get('/active', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Missing user ID.' });

  let [rows] = await pool.query(
    `SELECT id, name, created_at FROM trips WHERE status = 'active' LIMIT 1`
  );

  if (!rows.length) {
    const [result] = await pool.query(
      `INSERT INTO trips (name, status, created_by) VALUES (?, 'active', ?)`,
      [null, userId]
    );
    rows = [{ id: result.insertId, name: null, created_at: new Date() }];
  }

  res.json(rows[0]);
});

// Complete the active trip
router.post('/:id/complete', async (req, res) => {
  const { id } = req.params;
  await pool.query(
    `UPDATE trips SET status = 'completed', completed_at = NOW() WHERE id = ? AND status = 'active'`,
    [id]
  );
  req.app.get('io').to(`trip-${id}`).emit('trip-completed', { trip_id: parseInt(id) });
  res.json({ success: true });
});

// Get all completed trips (history)
router.get('/history', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, name, created_at, completed_at FROM trips
     WHERE status = 'completed' ORDER BY completed_at DESC`
  );
  res.json(rows);
});

// Get a specific trip with its items
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const [trip] = await pool.query('SELECT * FROM trips WHERE id = ?', [id]);
  if (!trip.length) return res.status(404).json({ error: 'Trip not found.' });

  const [items] = await pool.query(
    `SELECT li.id, li.name, li.quantity, li.unit, li.checked, li.created_at,
            d.id AS department_id, d.name AS department,
            u.name AS added_by
     FROM list_items li
     JOIN departments d ON d.id = li.department_id
     JOIN users u ON u.id = li.added_by
     WHERE li.trip_id = ?
     ORDER BY d.sort_order, li.name`,
    [id]
  );

  res.json({ ...trip[0], items });
});

// Copy a past trip — mode: 'replace' (default) or 'append'
router.post('/:id/copy', async (req, res) => {
  const { id } = req.params;
  const userId = req.headers['x-user-id'];
  const mode = req.body.mode || 'replace';
  if (!userId) return res.status(401).json({ error: 'Missing user ID.' });

  const [sourceItems] = await pool.query(
    'SELECT name, quantity, unit, department_id FROM list_items WHERE trip_id = ?',
    [id]
  );
  if (!sourceItems.length) return res.status(404).json({ error: 'Source trip not found or empty.' });

  let targetTripId;

  if (mode === 'append') {
    const [active] = await pool.query(`SELECT id FROM trips WHERE status = 'active' LIMIT 1`);
    if (active.length) {
      targetTripId = active[0].id;
    } else {
      const [result] = await pool.query(
        `INSERT INTO trips (name, status, created_by) VALUES (?, 'active', ?)`,
        [null, userId]
      );
      targetTripId = result.insertId;
    }
  } else {
    await pool.query(`UPDATE trips SET status = 'completed', completed_at = NOW() WHERE status = 'active'`);
    const [result] = await pool.query(
      `INSERT INTO trips (name, status, created_by) VALUES (?, 'active', ?)`,
      [null, userId]
    );
    targetTripId = result.insertId;
  }

  for (const item of sourceItems) {
    await pool.query(
      'INSERT INTO list_items (trip_id, name, quantity, unit, department_id, added_by) VALUES (?, ?, ?, ?, ?, ?)',
      [targetTripId, item.name, item.quantity, item.unit, item.department_id, userId]
    );
  }

  res.status(201).json({ id: targetTripId });
});

export default router;
