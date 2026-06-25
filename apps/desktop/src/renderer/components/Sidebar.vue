<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <span class="logo">弈</span>
      <n-button text @click="store.createSession" size="small">
        <n-icon size="16"><AddOutline /></n-icon>
      </n-button>
    </div>
    <div class="sidebar-search">
      <n-input placeholder="搜索..." size="small" clearable>
        <template #prefix>
          <n-icon><SearchOutline /></n-icon>
        </template>
      </n-input>
    </div>
    <div class="sidebar-list">
      <div v-for="s in store.sessions" :key="s.id"
        class="session-item"
        :class="{ active: s.id === store.activeSessionId }"
        @click="store.switchSession(s.id)">
        <div class="session-title">{{ s.title }}</div>
        <div class="session-date">{{ formatDate(s.updatedAt) }}</div>
      </div>
    </div>
    <div class="sidebar-footer">
      <n-button text size="small" block>设置</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NInput, NButton, NIcon } from 'naive-ui';
import { AddOutline, SearchOutline } from '@vicons/ionicons5';
import { useAgentStore } from '../store.js';

const store = useAgentStore();

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};
</script>

<style scoped>
.sidebar {
  width: 260px;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  flex-shrink: 0;
}
.sidebar-header {
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.logo { font-weight: 600; font-size: 18px; }
.sidebar-search { padding: 8px 12px; }
.sidebar-list { flex: 1; overflow-y: auto; padding: 0 8px; }
.session-item {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 2px;
  border: 1px solid transparent;
}
.session-item:hover { background: #fafafa; }
.session-item.active {
  background: #f0f5ff;
  border-color: #bae0ff;
}
.session-title {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.session-date { font-size: 12px; color: #999; margin-top: 2px; }
.sidebar-footer { padding: 8px; border-top: 1px solid #f0f0f0; }
</style>
