import { Router } from 'express';
import pool from '../database/db.js';
import { categorizeItem } from '../services/categorizer.js';

const router = Router();

// Add item to a trip
router.post('/', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Missing user ID.' });

  const { trip_id, name, quantity, unit } = req.body;
  if (!trip_id || !name) return res.status(400).json({ error: 'trip_id and name are required.' });

  const department_id = await categorizeItem(name);

  const [result] = await pool.query(
    'INSERT INTO list_items (trip_id, name, quantity, unit, department_id, added_by) VALUES (?, ?, ?, ?, ?, ?)',
    [trip_id, name.trim(), quantity || null, unit || null, department_id, userId]
  );

  const [rows] = await pool.query(
    `SELECT li.id, li.name, li.quantity, li.unit, li.checked, li.created_at,
            d.id AS department_id, d.name AS department,
            u.name AS added_by
     FROM list_items li
     JOIN departments d ON d.id = li.department_id
     JOIN users u ON u.id = li.added_by
     WHERE li.id = ?`,
    [result.insertId]
  );

  const item = rows[0];
  req.app.get('io').to(`trip-${trip_id}`).emit('item-added', { item });
  res.status(201).json(item);
});

// Toggle checked state
router.patch('/:id/check', async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE list_items SET checked = NOT checked WHERE id = ?', [id]);
  const [rows] = await pool.query(
    'SELECT li.id, li.checked, li.trip_id FROM list_items li WHERE li.id = ?', [id]
  );
  const item = rows[0];
  req.app.get('io').to(`trip-${item.trip_id}`).emit('item-checked', { item });
  res.json(item);
});

// Delete an item
router.delete('/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT trip_id FROM list_items WHERE id = ?', [req.params.id]);
  if (rows.length) {
    await pool.query('DELETE FROM list_items WHERE id = ?', [req.params.id]);
    req.app.get('io').to(`trip-${rows[0].trip_id}`).emit('item-deleted', { id: parseInt(req.params.id) });
  }
  res.json({ success: true });
});

// Autocomplete suggestions from learned cache + item history
router.get('/suggest', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);

  const [rows] = await pool.query(
    `SELECT DISTINCT li.name, d.name AS department
     FROM list_items li
     JOIN departments d ON d.id = li.department_id
     WHERE li.name LIKE ?
     UNION
     SELECT lc.item_name AS name, d.name AS department
     FROM learned_categories lc
     JOIN departments d ON d.id = lc.department_id
     WHERE lc.item_name LIKE ?
     ORDER BY name ASC
     LIMIT 8`,
    [`${q}%`, `${q}%`]
  );
  res.json(rows);
});

export default router;
