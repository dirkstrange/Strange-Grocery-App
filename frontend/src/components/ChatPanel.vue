<template>
  <div class="chat-panel">
    <div class="messages" ref="messagesEl">
      <div v-if="messages.length === 0" class="empty">
        Ask for recipe ideas, meal planning suggestions, or anything grocery related. Claude can add items to your list.
      </div>
      <div
        v-for="msg in messages"
        :key="msg.id ?? msg._key"
        class="message"
        :class="msg.role"
      >
        <div class="bubble" v-html="formatMessage(msg.content)"></div>
        <div class="meta">{{ msg.role === 'user' ? (msg.user_name || 'You') : 'Claude' }}</div>
      </div>
      <div v-if="loading" class="message assistant">
        <div class="bubble typing">Claude is thinking...</div>
      </div>
    </div>

    <form class="input-row" @submit.prevent="send">
      <input
        v-model="draft"
        type="text"
        placeholder="Ask Claude..."
        :disabled="loading"
        autocomplete="off"
      />
      <button type="submit" :disabled="!draft.trim() || loading">Send</button>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { getChatHistory, sendChat } from '../api.js';

const props = defineProps({ tripId: Number, userId: Number });
const emit  = defineEmits(['items-added']);

const messages   = ref([]);
const draft      = ref('');
const loading    = ref(false);
const messagesEl = ref(null);

onMounted(async () => {
  messages.value = await getChatHistory(props.tripId);
  scrollBottom();
});

watch(messages, () => nextTick(scrollBottom), { deep: true });

function scrollBottom() {
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
}

function formatMessage(text) {
  // Strip add-items code blocks from display, convert newlines to <br>
  return text
    .replace(/```add-items[\s\S]*?```/g, '<em>[Items added to list]</em>')
    .replace(/\n/g, '<br>');
}

async function send() {
  if (!draft.value.trim() || loading.value) return;
  const text = draft.value.trim();
  draft.value = '';

  messages.value.push({ _key: Date.now(), role: 'user', content: text, user_name: 'You' });
  loading.value = true;

  const result = await sendChat(props.tripId, text, props.userId);
  messages.value.push({ _key: Date.now() + 1, role: 'assistant', content: result.reply });

  if (result.added_items?.length) emit('items-added', result.added_items);

  loading.value = false;
}
</script>

<style scoped>
.chat-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.messages { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
.empty { color: var(--text-muted); font-size: 0.9rem; text-align: center; padding: 1rem; line-height: 1.6; }
.message { display: flex; flex-direction: column; max-width: 85%; }
.message.user { align-self: flex-end; align-items: flex-end; }
.message.assistant { align-self: flex-start; align-items: flex-start; }
.bubble {
  padding: 0.65rem 0.9rem;
  border-radius: 10px;
  font-size: 0.95rem;
  line-height: 1.5;
  word-break: break-word;
}
.message.user .bubble {
  background: var(--primary);
  color: #fff;
  border-bottom-right-radius: 3px;
  box-shadow: var(--glow-pink);
}
.message.assistant .bubble {
  background: var(--surface2);
  color: var(--text);
  border: 1px solid var(--accent);
  border-bottom-left-radius: 3px;
  box-shadow: var(--glow-cyan);
}
.typing { color: var(--accent); font-style: italic; }
.meta { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.25rem; padding: 0 0.25rem; }
.input-row {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  border-top: 1px solid var(--border);
  background: var(--surface);
}
.input-row input {
  flex: 1;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 0.95rem;
  background: var(--bg);
  color: var(--text);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.input-row input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: var(--glow-cyan);
}
.input-row button {
  padding: 0.65rem 1.1rem;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  box-shadow: var(--glow-pink);
  transition: opacity 0.2s;
}
.input-row button:disabled { opacity: 0.35; box-shadow: none; }
</style>
