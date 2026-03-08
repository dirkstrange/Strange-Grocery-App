<template>
  <div class="item" :class="{ checked: item.checked }">
    <button class="check-btn" @click="$emit('toggle', item.id)" :aria-label="item.checked ? 'Uncheck' : 'Check'">
      <span class="checkmark">{{ item.checked ? '✓' : '' }}</span>
    </button>
    <div class="details">
      <span class="item-name">{{ item.name }}</span>
      <span v-if="item.quantity || item.unit" class="item-qty">
        {{ formatQty(item.quantity) }} {{ item.unit }}
      </span>
    </div>
    <button class="delete-btn" @click="$emit('delete', item.id)" aria-label="Delete">✕</button>
  </div>
</template>

<script setup>
defineProps({ item: Object });
defineEmits(['toggle', 'delete']);

function formatQty(qty) {
  if (qty == null) return '';
  const n = parseFloat(qty);
  return n % 1 === 0 ? n.toFixed(0) : n.toString();
}
</script>

<style scoped>
.item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
  transition: opacity 0.2s, background 0.2s;
}
.item:hover { background: var(--surface2); }
.item.checked { opacity: 0.45; }
.item.checked .item-name { text-decoration: line-through; color: var(--text-muted); }
.check-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--primary);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--primary);
  font-weight: bold;
  font-size: 0.85rem;
  transition: background 0.15s, box-shadow 0.15s;
  box-shadow: 0 0 6px rgba(255,45,120,0.3);
}
.item.checked .check-btn {
  background: var(--primary);
  color: #fff;
  box-shadow: var(--glow-pink);
}
.details { flex: 1; min-width: 0; }
.item-name { display: block; font-size: 1rem; color: var(--text); }
.item-qty  { font-size: 0.8rem; color: var(--accent); }
.delete-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.25rem;
  line-height: 1;
  transition: color 0.15s;
}
.delete-btn:hover { color: #ff4444; text-shadow: 0 0 6px rgba(255,68,68,0.6); }
</style>
