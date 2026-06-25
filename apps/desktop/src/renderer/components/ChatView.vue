<template>
  <div class="chat-view">
    <div class="chat-header">
      <span class="chat-title">{{ currentSessionTitle }}</span>
      <n-select v-model:value="store.mode" :options="modeOptions" size="small" style="width: 140px" />
    </div>
    <div class="chat-messages" ref="messagesRef">
      <div v-if="store.nodes.length === 0" class="empty-state">
        <div class="empty-title">开始新的对话</div>
        <div class="empty-subtitle">输入指令，Agent 将自动规划并执行</div>
      </div>
      <template v-else>
        <MessageBubble v-for="node in store.nodes" :key="node.id" :node="node" />
      </template>
    </div>
    <div class="chat-input">
      <n-input v-model:value="inputText" type="textarea" placeholder="输入指令..." :autosize="{ minRows: 1, maxRows: 4 }"
        @keydown.enter.exact.prevent="handleSend" />
      <n-button type="primary" :disabled="!inputText.trim()" @click="handleSend" size="medium">
        <n-icon size="16"><SendOutline /></n-icon>
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { NInput, NButton, NSelect, NIcon } from 'naive-ui';
import { SendOutline } from '@vicons/ionicons5';
import { useAgentStore } from '../store.js';
import MessageBubble from './MessageBubble.vue';

const store = useAgentStore();
const inputText = ref('');
const messagesRef = ref<HTMLElement>();

const currentSessionTitle = computed(() => {
  const s = store.sessions.find((x) => x.id === store.activeSessionId);
  return s?.title ?? '对话';
});

const modeOptions = [
  { value: 'plan', label: '只读规划' },
  { value: 'ask', label: '逐次确认' },
  { value: 'trusted', label: '信任执行' },
  { value: 'bypass', label: '完全放行' },
];

const handleSend = () => {
  if (!inputText.value.trim()) return;
  store.addMessage(inputText.value.trim());
  inputText.value = '';
};

watch(() => store.nodes.length, async () => {
  await nextTick();
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
  }
});
</script>

<style scoped>
.chat-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  min-width: 0;
}
.chat-header {
  padding: 12px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
}
.chat-title { font-weight: 500; font-size: 15px; }
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
}
.empty-state {
  text-align: center;
  margin-top: 120px;
  color: #999;
}
.empty-title { font-size: 20px; margin-bottom: 8px; }
.empty-subtitle { font-size: 13px; }
.chat-input {
  padding: 12px 24px 20px;
  border-top: 1px solid #f0f0f0;
  background: #ffffff;
  display: flex;
  gap: 8px;
  align-items: flex-end;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
}
</style>
