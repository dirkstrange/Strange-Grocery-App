<template>
  <div class="overlay">
    <div class="card">
      <h1>Strange Grocery App</h1>
      <p>Enter your name to get started</p>
      <form @submit.prevent="submit">
        <input
          v-model="name"
          type="text"
          placeholder="Your name"
          autocomplete="off"
          autofocus
          maxlength="50"
        />
        <button type="submit" :disabled="!name.trim()">Continue</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['submit']);
const name = ref('');

function submit() {
  if (name.value.trim()) emit('submit', name.value.trim());
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 100;
}
.card {
  background: var(--surface);
  border: 1px solid var(--primary);
  border-radius: 10px;
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 360px;
  text-align: center;
  box-shadow: var(--glow-pink), 0 8px 40px rgba(0,0,0,0.5);
}
h1 {
  margin: 0 0 0.5rem;
  font-family: 'Orbitron', sans-serif;
  font-weight: 900;
  font-size: 1.3rem;
  letter-spacing: 0.04em;
  background: linear-gradient(90deg, #ff2d78, #00e5ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 6px rgba(255,45,120,0.4));
}
p { margin: 0 0 1.75rem; color: var(--text-muted); font-size: 0.9rem; }
input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 1rem;
  background: var(--bg);
  color: var(--text);
  box-sizing: border-box;
  margin-bottom: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}
input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: var(--glow-cyan);
}
button {
  width: 100%;
  padding: 0.75rem;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  cursor: pointer;
  box-shadow: var(--glow-pink);
  transition: opacity 0.2s;
}
button:disabled { opacity: 0.35; box-shadow: none; cursor: default; }
</style>
