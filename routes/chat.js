import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import pool from '../database/db.js';
import { chat } from '../services/claude.js';
import { categorizeItem } from '../services/categorizer.js';

const router = Router();
const client = new Anthropic();

const upload = multer({ dest: 'uploads/' });

// Send a chat message
router.post('/', async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Missing user ID.' });

  const { trip_id, message } = req.body;
  if (!trip_id || !message) return res.status(400).json({ error: 'trip_id and message are required.' });

  const reply = await chat(trip_id, message, userId);

  // Parse any add-items blocks from the reply
  const addedItems = [];
  const addItemsRegex = /```add-items\s*([\s\S]*?)```/g;
  let match;
  while ((match = addItemsRegex.exec(reply)) !== null) {
    try {
      const items = JSON.parse(match[1]);
      for (const item of items) {
        const department_id = await categorizeItem(item.name);
        const [result] = await pool.query(
          'INSERT INTO list_items (trip_id, name, quantity, unit, department_id, added_by) VALUES (?, ?, ?, ?, ?, ?)',
          [trip_id, item.name, item.quantity || null, item.unit || null, department_id, userId]
        );
        const [rows] = await pool.query(
          `SELECT li.id, li.name, li.quantity, li.unit, li.checked,
                  d.id AS department_id, d.name AS department, u.name AS added_by
           FROM list_items li
           JOIN departments d ON d.id = li.department_id
           JOIN users u ON u.id = li.added_by
           WHERE li.id = ?`,
          [result.insertId]
        );
        addedItems.push(rows[0]);
        req.app.get('io').to(`trip-${trip_id}`).emit('item-added', { item: rows[0] });
      }
    } catch {
      // Malformed JSON in add-items block — skip silently
    }
  }

  res.json({ reply, added_items: addedItems });
});

// Get chat history for a trip
router.get('/:trip_id', async (req, res) => {
  const [rows] = await pool.query(
    `SELECT cm.id, cm.role, cm.content, cm.created_at, u.name AS user_name
     FROM chat_messages cm
     LEFT JOIN users u ON u.id = cm.user_id
     WHERE cm.trip_id = ?
     ORDER BY cm.created_at ASC`,
    [req.params.trip_id]
  );
  res.json(rows);
});

// Upload a photo of a handwritten list
router.post('/photo', upload.single('photo'), async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Missing user ID.' });

  const { trip_id } = req.body;
  if (!trip_id || !req.file) return res.status(400).json({ error: 'trip_id and photo are required.' });

  const imageData = fs.readFileSync(req.file.path);
  const base64Image = imageData.toString('base64');
  const mimeType = req.file.mimetype;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeType, data: base64Image },
        },
        {
          type: 'text',
          text: 'This is a handwritten grocery list. Extract all grocery items you can read. Return only a JSON array of objects with this format: [{"name": "item name", "quantity": 1, "unit": "each"}]. Use null for quantity and unit if not specified. Return nothing else.',
        },
      ],
    }],
  });

  // Clean up temp file
  fs.unlinkSync(req.file.path);

  let items = [];
  try {
    items = JSON.parse(response.content[0].text);
  } catch {
    return res.status(422).json({ error: 'Could not parse items from the image.' });
  }

  const addedItems = [];
  for (const item of items) {
    const department_id = await categorizeItem(item.name);
    const [result] = await pool.query(
      'INSERT INTO list_items (trip_id, name, quantity, unit, department_id, added_by) VALUES (?, ?, ?, ?, ?, ?)',
      [trip_id, item.name, item.quantity || null, item.unit || null, department_id, userId]
    );
    const [rows] = await pool.query(
      `SELECT li.id, li.name, li.quantity, li.unit, li.checked,
              d.id AS department_id, d.name AS department, u.name AS added_by
       FROM list_items li
       JOIN departments d ON d.id = li.department_id
       JOIN users u ON u.id = li.added_by
       WHERE li.id = ?`,
      [result.insertId]
    );
    addedItems.push(rows[0]);
  }

  res.status(201).json({ added_items: addedItems });
});

export default router;
