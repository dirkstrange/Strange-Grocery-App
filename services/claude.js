import Anthropic from '@anthropic-ai/sdk';
import pool from '../database/db.js';

const client = new Anthropic();

// Build system prompt with current list + last 10 completed trips
async function buildSystemPrompt(tripId) {
  // Current list items
  const [currentItems] = await pool.query(
    `SELECT li.name, li.quantity, li.unit, d.name AS department
     FROM list_items li
     JOIN departments d ON d.id = li.department_id
     WHERE li.trip_id = ?
     ORDER BY d.sort_order, li.name`,
    [tripId]
  );

  // Last 10 completed trips
  const [pastTrips] = await pool.query(
    `SELECT id, name, completed_at FROM trips
     WHERE status = 'completed'
     ORDER BY completed_at DESC LIMIT 10`
  );

  let pastTripDetails = '';
  for (const trip of pastTrips) {
    const [items] = await pool.query(
      `SELECT li.name, li.quantity, li.unit FROM list_items li WHERE li.trip_id = ?`,
      [trip.id]
    );
    const itemList = items.map(i => `${i.quantity ? i.quantity + ' ' + i.unit + ' ' : ''}${i.name}`).join(', ');
    pastTripDetails += `\n- ${trip.name || trip.completed_at}: ${itemList}`;
  }

  const currentList = currentItems.length
    ? currentItems.map(i => `${i.quantity ? i.quantity + ' ' + i.unit + ' ' : ''}${i.name} (${i.department})`).join('\n')
    : 'The list is currently empty.';

  return `You are a helpful grocery shopping assistant. You help with meal planning, recipe suggestions, and managing grocery lists.

CURRENT GROCERY LIST:
${currentList}

PAST 10 TRIPS:${pastTripDetails || '\nNo past trips yet.'}

When the user asks for recipes or meal ideas, suggest items they may need and offer to add them to the list. When adding items, respond with a JSON block in this exact format so the app can process it:

\`\`\`add-items
[
  {"name": "item name", "quantity": 1, "unit": "each"},
  {"name": "another item", "quantity": 2, "unit": "lbs"}
]\`\`\`

Always include the add-items block when you recommend items the user should buy. Units should be one of: each, lbs, oz, dozen, gallons, quarts, pints, cups, bunches, bags, boxes, cans, bottles, jars, packages.`;
}

export async function chat(tripId, userMessage, userId) {
  // Persist user message
  await pool.query(
    'INSERT INTO chat_messages (trip_id, role, content, user_id) VALUES (?, "user", ?, ?)',
    [tripId, userMessage, userId]
  );

  // Load conversation history for this trip
  const [history] = await pool.query(
    'SELECT role, content FROM chat_messages WHERE trip_id = ? ORDER BY created_at ASC',
    [tripId]
  );

  const systemPrompt = await buildSystemPrompt(tripId);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: history.map(m => ({ role: m.role, content: m.content })),
  });

  const assistantMessage = response.content[0].text;

  // Persist assistant message
  await pool.query(
    'INSERT INTO chat_messages (trip_id, role, content, user_id) VALUES (?, "assistant", ?, NULL)',
    [tripId, assistantMessage]
  );

  return assistantMessage;
}
