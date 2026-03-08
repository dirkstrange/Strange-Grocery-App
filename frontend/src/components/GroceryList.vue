<template>
  <div class="grocery-list">
    <AddItemForm @add="onAdd" @photo="onPhoto" />

    <div v-if="uploading" class="status-bar">Scanning photo...</div>
    <div v-if="adding"    class="status-bar">Adding item...</div>

    <div class="items-scroll">
      <div v-if="grouped.length === 0" class="empty">
        Your list is empty. Add an item above.
      </div>

      <div v-for="dept in grouped" :key="dept.name" class="dept-group">
        <div class="dept-header">{{ dept.name }}</div>
        <ListItem
          v-for="item in dept.items"
          :key="item.id"
          :item="item"
          @toggle="onToggle"
          @delete="onDelete"
        />
      </div>
    </div>

    <div v-if="items.length > 0" class="footer-actions">
      <button class="btn-secondary" @click="$emit('print')">Print List</button>
      <button class="btn-danger" @click="onComplete">Complete Trip</button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import AddItemForm from './AddItemForm.vue';
import ListItem    from './ListItem.vue';
import { addItem, toggleItem, deleteItem, completeTrip, uploadPhoto } from '../api.js';

const props = defineProps({ items: Array, tripId: Number, userId: Number });
const emit  = defineEmits(['update:items', 'print', 'trip-completed']);

const adding   = ref(false);
const uploading = ref(false);

const grouped = computed(() => {
  const map = {};
  for (const item of props.items) {
    if (!map[item.department]) map[item.department] = [];
    map[item.department].push(item);
  }
  return Object.entries(map)
    .map(([name, items]) => ({ name, items }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

async function onAdd({ name, quantity, unit }) {
  adding.value = true;
  const item = await addItem(props.tripId, name, quantity, unit, props.userId);
  if (item && item.id && !props.items.find(i => i.id === item.id)) {
    emit('update:items', [...props.items, item]);
  }
  adding.value = false;
}

async function onToggle(itemId) {
  emit('update:items', props.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i));
  await toggleItem(itemId);
}

async function onDelete(itemId) {
  emit('update:items', props.items.filter(i => i.id !== itemId));
  await deleteItem(itemId);
}

async function onComplete() {
  if (!confirm('Mark this trip as complete?')) return;
  await completeTrip(props.tripId, props.userId);
  // server broadcasts trip-completed via socket
}

async function onPhoto(file) {
  uploading.value = true;
  await uploadPhoto(props.tripId, file, props.userId);
  // server broadcasts item-added for each photo item via socket
  uploading.value = false;
}
</script>

<style scoped>
.grocery-list { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.items-scroll { flex: 1; overflow-y: auto; }
.status-bar {
  padding: 0.5rem 1rem;
  background: linear-gradient(90deg, rgba(255,45,120,0.2), rgba(0,229,255,0.2));
  border-bottom: 1px solid var(--border);
  color: var(--accent);
  font-size: 0.85rem;
  text-align: center;
  letter-spacing: 0.05em;
}
.empty { padding: 2rem; text-align: center; color: var(--text-muted); }
.dept-group { margin-bottom: 0.25rem; }
.dept-header {
  padding: 0.4rem 1rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--accent);
  background: var(--surface2);
  border-left: 2px solid var(--accent);
}
.footer-actions {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  margin-top: auto;
  border-top: 1px solid var(--border);
  background: var(--surface);
}
.btn-secondary {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--accent);
  border-radius: 6px;
  background: transparent;
  color: var(--accent);
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: var(--glow-cyan);
  transition: opacity 0.2s;
}
.btn-danger {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ff4444;
  border-radius: 6px;
  background: transparent;
  color: #ff4444;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(255,68,68,0.4);
  transition: opacity 0.2s;
}
</style>
