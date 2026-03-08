<template>
  <div class="print-view">
    <div class="print-header">
      <h1>Grocery List</h1>
      <p>{{ formatDate(new Date()) }}</p>
      <button class="no-print" @click="$emit('close')">← Back</button>
      <button class="no-print print-btn" @click="print()">Print</button>
    </div>

    <div class="dept-sections">
    <div v-for="dept in grouped" :key="dept.name" class="dept-section">
      <h2>{{ dept.name }}</h2>
      <ul>
        <li v-for="item in dept.items" :key="item.id">
          <span class="check-box"></span>
          <span class="item-text">
            {{ item.name }}
            <span v-if="item.quantity || item.unit" class="qty">
              — {{ item.quantity }} {{ item.unit }}
            </span>
          </span>
        </li>
      </ul>
    </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({ items: Array });
defineEmits(['close']);

const grouped = computed(() => {
  const map = {};
  for (const item of props.items.filter(i => !i.checked)) {
    if (!map[item.department]) map[item.department] = [];
    map[item.department].push(item);
  }
  return Object.entries(map)
    .map(([name, items]) => ({ name, items }))
    .sort((a, b) => a.name.localeCompare(b.name));
});

function print() { window.print(); }

function formatDate(d) {
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
</script>

<style scoped>
.print-view { padding: 1.5rem; max-width: 600px; margin: 0 auto; }
.print-header { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
.print-header h1 { margin: 0; font-size: 1.5rem; flex: 1; }
.print-header p  { margin: 0; color: var(--text-muted); width: 100%; order: 3; }
.no-print { padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; border: 1px solid var(--border); background: var(--surface); color: var(--text); }
.print-btn { background: var(--primary); color: #fff; border-color: var(--primary); }
.dept-section { margin-bottom: 1.25rem; }
.dept-section h2 { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); border-bottom: 1px solid var(--border); padding-bottom: 0.25rem; margin-bottom: 0.5rem; }
ul { list-style: none; padding: 0; margin: 0; }
li { display: flex; align-items: baseline; gap: 0.75rem; padding: 0.3rem 0; font-size: 1rem; }
.check-box { width: 16px; height: 16px; border: 1.5px solid #999; border-radius: 3px; flex-shrink: 0; display: inline-block; }
.qty { color: var(--text-muted); font-size: 0.9rem; }

@media print {
  .no-print { display: none !important; }
  .print-view { padding: 0.5in; max-width: none; }
  .print-header { margin-bottom: 0.3in; }
  .dept-sections { columns: 2; column-gap: 0.4in; }
  .dept-section { break-inside: avoid; }
}
</style>
