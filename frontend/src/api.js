const BASE = '/api';

function headers(userId) {
  return {
    'Content-Type': 'application/json',
    ...(userId ? { 'x-user-id': userId } : {}),
  };
}

export async function registerSession(name, session_token) {
  const res = await fetch(`${BASE}/users/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, session_token }),
  });
  return res.json();
}

export async function getActiveTrip(userId) {
  const res = await fetch(`${BASE}/trips/active`, { headers: headers(userId) });
  return res.json();
}

export async function completeTrip(tripId, userId) {
  const res = await fetch(`${BASE}/trips/${tripId}/complete`, {
    method: 'POST',
    headers: headers(userId),
  });
  return res.json();
}

export async function getTripHistory() {
  const res = await fetch(`${BASE}/trips/history`);
  return res.json();
}

export async function getTrip(tripId) {
  const res = await fetch(`${BASE}/trips/${tripId}`);
  return res.json();
}

export async function copyTrip(tripId, userId, mode = 'replace') {
  const res = await fetch(`${BASE}/trips/${tripId}/copy`, {
    method: 'POST',
    headers: headers(userId),
    body: JSON.stringify({ mode }),
  });
  return res.json();
}

export async function suggestItems(q) {
  if (!q) return [];
  const res = await fetch(`${BASE}/items/suggest?q=${encodeURIComponent(q)}`);
  return res.json();
}

export async function addItem(tripId, name, quantity, unit, userId) {
  const res = await fetch(`${BASE}/items`, {
    method: 'POST',
    headers: headers(userId),
    body: JSON.stringify({ trip_id: tripId, name, quantity, unit }),
  });
  return res.json();
}

export async function toggleItem(itemId) {
  const res = await fetch(`${BASE}/items/${itemId}/check`, { method: 'PATCH' });
  return res.json();
}

export async function deleteItem(itemId) {
  await fetch(`${BASE}/items/${itemId}`, { method: 'DELETE' });
}

export async function sendChat(tripId, message, userId) {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: headers(userId),
    body: JSON.stringify({ trip_id: tripId, message }),
  });
  return res.json();
}

export async function getChatHistory(tripId) {
  const res = await fetch(`${BASE}/chat/${tripId}`);
  return res.json();
}

export async function uploadPhoto(tripId, file, userId) {
  const form = new FormData();
  form.append('photo', file);
  form.append('trip_id', tripId);
  const res = await fetch(`${BASE}/chat/photo`, {
    method: 'POST',
    headers: { 'x-user-id': userId },
    body: form,
  });
  return res.json();
}
