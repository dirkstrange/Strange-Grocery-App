<template>
  <div class="history">
    <div v-if="loading" class="empty">Loading...</div>
    <div v-else-if="trips.length === 0" class="empty">No completed trips yet.</div>

    <div v-for="trip in trips" :key="trip.id" class="trip-card">
      <div class="trip-header" @click="toggle(trip.id)">
        <div class="trip-info">
          <span class="trip-name">{{ trip.name || formatDate(trip.completed_at) }}</span>
          <span class="trip-date">{{ formatDate(trip.completed_at) }}</span>
        </div>
        <div class="trip-actions">
          <template v-if="copyingTripId === trip.id">
            <button class="btn-copy-mode" @click.stop="doCopy(trip.id, 'append')">Append</button>
            <button class="btn-copy-mode btn-replace" @click.stop="doCopy(trip.id, 'replace')">Replace</button>
            <button class="btn-cancel" @click.stop="copyingTripId = null">✕</button>
          </template>
          <button v-else class="btn-copy" @click.stop="copyingTripId = trip.id">Copy to List</button>
          <span class="chevron">{{ expanded === trip.id ? '▲' : '▼' }}</span>
        </div>
      </div>

      <div v-if="expanded === trip.id" class="trip-items">
        <div v-if="!detail[trip.id]" class="loading-items">Loading items...</div>
        <template v-else>
          <div v-for="dept in groupedItems(detail[trip.id])" :key="dept.name">
            <div class="dept-label">{{ dept.name }}</div>
            <div v-for="item in dept.items" :key="item.id" class="hist-item">
              {{ item.quantity ? item.quantity + ' ' + item.unit + ' ' : '' }}{{ item.name }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getTripHistory, getTrip } from '../api.js';

const emit = defineEmits(['copy']);

const trips   = ref([]);
const loading = ref(true);
const expanded = ref(null);
const detail   = ref({});
const copyingTripId = ref(null);

function doCopy(tripId, mode) {
  copyingTripId.value = null;
  emit('copy', tripId, mode);
}

onMounted(async () => {
  trips.value = await getTripHistory();
  loading.value = false;
});

async function toggle(tripId) {
  if (expanded.value === tripId) { expanded.value = null; return; }
  expanded.value = tripId;
  if (!detail.value[tripId]) {
    const data = await getTrip(tripId);
    detail.value[tripId] = data.items;
  }
}

function groupedItems(items) {
  const map = {};
  for (const item of items) {
    if (!map[item.department]) map[item.department] = [];
    map[item.department].push(item);
  }
  return Object.entries(map).map(([name, items]) => ({ name, items }));
}

function formatDate(dt) {
  return new Date(dt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
</script>

<style scoped>
.history { overflow-y: auto; height: 100%; }
.empty { padding: 2rem; text-align: center; color: var(--text-muted); }
.trip-card { border-bottom: 1px solid var(--border); transition: background 0.2s; }
.trip-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}
.trip-header:hover { background: var(--surface2); }
.trip-info { display: flex; flex-direction: column; }
.trip-name { font-weight: 600; color: var(--text); }
.trip-date { font-size: 0.78rem; color: var(--accent); margin-top: 0.1rem; }
.trip-actions { display: flex; align-items: center; gap: 0.5rem; }
.btn-copy {
  padding: 0.4rem 0.75rem;
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 0 6px rgba(255,45,120,0.3);
  transition: box-shadow 0.2s;
}
.btn-copy:hover { box-shadow: var(--glow-pink); }
.chevron { color: var(--accent); font-size: 0.7rem; }
.btn-copy-mode {
  padding: 0.35rem 0.6rem;
  background: transparent;
  color: var(--primary);
  border: 1px solid var(--primary);
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.btn-replace {
  color: #ff4444;
  border-color: #ff4444;
}
.btn-cancel {
  padding: 0.35rem 0.5rem;
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
}
.trip-items {
  padding: 0.5rem 1rem 1rem;
  background: var(--bg);
  border-top: 1px solid var(--border);
}
.loading-items { color: var(--text-muted); font-size: 0.85rem; }
.dept-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
  margin: 0.5rem 0 0.25rem;
}
.hist-item { font-size: 0.9rem; color: var(--text); padding: 0.15rem 0; }
</style>
