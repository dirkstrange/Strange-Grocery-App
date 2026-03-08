<template>
  <form class="add-form" @submit.prevent="submit">
    <div class="input-wrap">
      <input
        v-model="name"
        type="text"
        placeholder="Add item..."
        autocomplete="off"
        class="item-input"
        @input="onInput"
        @keydown.down.prevent="moveDown"
        @keydown.up.prevent="moveUp"
        @keydown.enter.prevent="selectOrSubmit"
        @keydown.escape="closeSuggestions"
        @blur="onBlur"
      />
      <ul v-if="suggestions.length" class="suggestions">
        <li
          v-for="(s, i) in suggestions"
          :key="s.name"
          :class="{ active: i === activeIndex }"
          @mousedown.prevent="pickSuggestion(s)"
        >
          <span class="sug-name">{{ s.name }}</span>
          <span class="sug-dept">{{ s.department }}</span>
        </li>
      </ul>
    </div>
    <div class="row">
      <input
        v-model="quantity"
        type="number"
        min="0"
        step="1"
        placeholder="Qty"
        class="qty-input"
      />
      <select v-model="unit" class="unit-select">
        <option value="">Unit</option>
        <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
      </select>
      <button type="submit" :disabled="!name.trim() || loading">
        {{ loading ? '...' : 'Add' }}
      </button>
    </div>
    <div class="photo-row">
      <label class="photo-btn">
        📷 Upload handwritten list
        <input type="file" accept="image/*" @change="onPhoto" hidden />
      </label>
    </div>
  </form>
</template>

<script setup>
import { ref } from 'vue';
import { suggestItems } from '../api.js';

const emit = defineEmits(['add', 'photo']);
const name        = ref('');
const quantity    = ref(1);
const unit        = ref('each');
const loading     = ref(false);
const suggestions = ref([]);
const activeIndex = ref(-1);
let debounceTimer = null;

const units = ['each', 'lbs', 'oz', 'dozen', 'gallons', 'quarts', 'pints', 'cups', 'bunches', 'bags', 'boxes', 'cans', 'bottles', 'jars', 'packages'];

function onInput() {
  activeIndex.value = -1;
  clearTimeout(debounceTimer);
  if (!name.value.trim()) { suggestions.value = []; return; }
  debounceTimer = setTimeout(async () => {
    suggestions.value = await suggestItems(name.value.trim());
  }, 200);
}

function moveDown() {
  if (!suggestions.value.length) return;
  activeIndex.value = Math.min(activeIndex.value + 1, suggestions.value.length - 1);
}

function moveUp() {
  activeIndex.value = Math.max(activeIndex.value - 1, -1);
}

function selectOrSubmit() {
  if (activeIndex.value >= 0 && suggestions.value[activeIndex.value]) {
    pickSuggestion(suggestions.value[activeIndex.value]);
  } else {
    submit();
  }
}

function pickSuggestion(s) {
  name.value = s.name;
  suggestions.value = [];
  activeIndex.value = -1;
}

function closeSuggestions() {
  suggestions.value = [];
  activeIndex.value = -1;
}

function onBlur() {
  setTimeout(closeSuggestions, 150);
}

async function submit() {
  if (!name.value.trim()) return;
  closeSuggestions();
  loading.value = true;
  await emit('add', {
    name: name.value.trim(),
    quantity: quantity.value ? parseFloat(quantity.value) : null,
    unit: unit.value || null,
  });
  name.value = '';
  quantity.value = 1;
  unit.value = 'each';
  loading.value = false;
}

function onPhoto(e) {
  const file = e.target.files[0];
  if (file) emit('photo', file);
  e.target.value = '';
}
</script>

<style scoped>
.add-form {
  padding: 0.75rem;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.input-wrap { position: relative; margin-bottom: 0.5rem; }
.item-input {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 1rem;
  background: var(--bg);
  color: var(--text);
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.item-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: var(--glow-cyan);
}
.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-top: none;
  border-radius: 0 0 6px 6px;
  list-style: none;
  margin: 0;
  padding: 0;
  z-index: 10;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}
.suggestions li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
}
.suggestions li:last-child { border-bottom: none; }
.suggestions li:hover,
.suggestions li.active { background: var(--bg); }
.sug-name { font-size: 0.95rem; color: var(--text); }
.sug-dept { font-size: 0.75rem; color: var(--accent); }
.row { display: flex; gap: 0.5rem; }
.qty-input {
  width: 70px;
  padding: 0.6rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.9rem;
  background: var(--bg);
  color: var(--text);
}
.qty-input:focus { outline: none; border-color: var(--accent); box-shadow: var(--glow-cyan); }
.unit-select {
  flex: 1;
  padding: 0.6rem 0.5rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.9rem;
  background: var(--bg);
  color: var(--text);
}
button {
  padding: 0.6rem 1.25rem;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  letter-spacing: 0.04em;
  box-shadow: var(--glow-pink);
  transition: opacity 0.2s;
}
button:disabled { opacity: 0.35; box-shadow: none; }
.photo-row { margin-top: 0.5rem; }
.photo-btn { font-size: 0.85rem; color: var(--accent); cursor: pointer; }
</style>
