<template>
  <div id="app">
    <NamePrompt v-if="!user" @submit="onNameSubmit" />

    <PrintView
      v-else-if="printing"
      :items="items"
      @close="printing = false"
    />

    <template v-else>
      <header class="app-header">
        <span class="app-title">Strange Grocery App</span>
        <div class="header-right">
          <button class="dark-toggle" @click="toggleDark" :aria-label="isDark ? 'Light mode' : 'Dark mode'">
            {{ isDark ? '☀️' : '🌙' }}
          </button>
          <span class="user-name">{{ user.name }}</span>
        </div>
      </header>

      <nav class="tab-bar">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>

      <main class="main-content">
        <GroceryList
          v-if="activeTab === 'list'"
          :items="items"
          :trip-id="tripId"
          :user-id="user.id"
          @update:items="items = $event"
          @print="printing = true"
          @trip-completed="onTripCompleted"
        />
        <ChatPanel
          v-else-if="activeTab === 'chat'"
          :trip-id="tripId"
          :user-id="user.id"
          @items-added="onItemsAdded"
        />
        <TripHistory
          v-else-if="activeTab === 'history'"
          @copy="onCopyTrip"
        />
      </main>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import NamePrompt   from './components/NamePrompt.vue';
import GroceryList  from './components/GroceryList.vue';
import ChatPanel    from './components/ChatPanel.vue';
import TripHistory  from './components/TripHistory.vue';
import PrintView    from './components/PrintView.vue';
import { registerSession, getActiveTrip, getTrip, copyTrip } from './api.js';
import socket from './socket.js';

const isDark = ref(localStorage.getItem('theme') !== 'light');

function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

function toggleDark() {
  isDark.value = !isDark.value;
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
  applyTheme(isDark.value);
}

applyTheme(isDark.value);

const user      = ref(null);
const tripId    = ref(null);
const items     = ref([]);
const printing  = ref(false);
const activeTab = ref('list');

const tabs = [
  { id: 'list',    label: 'List'    },
  { id: 'chat',    label: 'Chat'    },
  { id: 'history', label: 'History' },
];

onMounted(async () => {
  const token = localStorage.getItem('session_token');
  const name  = localStorage.getItem('user_name');
  if (token && name) {
    const u = await registerSession(name, token);
    user.value = u;
    await loadTrip(u.id);
  }
});

async function onNameSubmit(name) {
  const u = await registerSession(name, null);
  localStorage.setItem('session_token', u.session_token);
  localStorage.setItem('user_name', u.name);
  user.value = u;
  await loadTrip(u.id);
}

async function loadTrip(userId) {
  const trip = await getActiveTrip(userId);
  tripId.value = trip.id;
  const full = await getTrip(trip.id);
  items.value = full.items || [];
  socket.emit('join-trip', trip.id);
  setupSocketListeners();
}

function setupSocketListeners() {
  socket.off('connect');
  socket.off('item-added');
  socket.off('item-checked');
  socket.off('item-deleted');
  socket.off('trip-completed');

  socket.on('connect', () => {
    if (tripId.value) socket.emit('join-trip', tripId.value);
  });

  socket.on('item-added',     ({ item }) => { if (!items.value.find(i => i.id === item.id)) items.value.push(item); });
  socket.on('item-checked',   ({ item }) => { items.value = items.value.map(i => i.id === item.id ? { ...i, checked: item.checked } : i); });
  socket.on('item-deleted',   ({ id })   => { items.value = items.value.filter(i => i.id !== id); });
  socket.on('trip-completed', async () => { await loadTrip(user.value.id); activeTab.value = 'list'; });
}

function onItemsAdded(newItems) {
  for (const item of newItems) {
    if (!items.value.find(i => i.id === item.id)) items.value.push(item);
  }
}

async function onTripCompleted() {
  await loadTrip(user.value.id);
  activeTab.value = 'list';
}

async function onCopyTrip(sourceTripId, mode) {
  await copyTrip(sourceTripId, user.value.id, mode);
  await loadTrip(user.value.id);
  activeTab.value = 'list';
}
</script>

<style>
:root, [data-theme="dark"] {
  --primary:    #ff2d78;
  --accent:     #00e5ff;
  --bg:         #0d0d1a;
  --surface:    #12122a;
  --surface2:   #1a1a38;
  --border:     #2a1f5e;
  --text:       #e8e0ff;
  --text-muted: #8878c8;
  --glow-pink:  0 0 10px rgba(255,45,120,0.55), 0 0 25px rgba(255,45,120,0.2);
  --glow-cyan:  0 0 10px rgba(0,229,255,0.55), 0 0 25px rgba(0,229,255,0.2);
  --glow-border-pink: 0 0 0 1px #ff2d78, 0 0 10px rgba(255,45,120,0.4);
  --glow-border-cyan: 0 0 0 1px #00e5ff, 0 0 10px rgba(0,229,255,0.4);
}
[data-theme="light"] {
  --primary:    #c0005a;
  --accent:     #007799;
  --bg:         #f5eeff;
  --surface:    #ffffff;
  --surface2:   #f0e6ff;
  --border:     #ddd0f8;
  --text:       #1a0a3e;
  --text-muted: #7060a8;
  --glow-pink:  none;
  --glow-cyan:  none;
  --glow-border-pink: none;
  --glow-border-cyan: none;
}
body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
#app {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  width: 100%;
  margin: 0 auto;
  background: var(--surface);
}
@media (min-width: 768px) { #app { max-width: 800px; } }
@media print {
  body { background: white; }
  #app { max-width: none; height: auto; background: white; }
}
</style>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--surface);
  border-bottom: 1px solid var(--primary);
  box-shadow: 0 2px 18px rgba(255,45,120,0.25);
  flex-shrink: 0;
}
.app-title {
  font-family: 'Orbitron', sans-serif;
  font-weight: 900;
  font-size: 1rem;
  letter-spacing: 0.04em;
  background: linear-gradient(90deg, #ff2d78, #00e5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
  filter: drop-shadow(0 0 6px rgba(255,45,120,0.5));
}
.header-right { display: flex; align-items: center; gap: 0.75rem; }
.user-name  { font-size: 0.85rem; color: var(--accent); opacity: 0.9; }
.dark-toggle {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0;
  opacity: 0.9;
}
.tab-bar {
  display: flex;
  background: var(--surface2);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.tab {
  flex: 1;
  padding: 0.7rem;
  border: none;
  background: transparent;
  font-size: 0.85rem;
  color: var(--text-muted);
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.2s, border-color 0.2s, text-shadow 0.2s;
}
.tab.active {
  color: var(--primary);
  border-bottom-color: var(--primary);
  text-shadow: 0 0 8px rgba(255,45,120,0.7);
}
.main-content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
</style>
