<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NPopover, NScrollbar } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useAgentsStore } from '@/stores/yi/agents'

const { t } = useI18n()
const agentsStore = useAgentsStore()

const show = ref(false)
const search = ref('')

const currentAgent = computed(() => agentsStore.activeAgent)

const filteredAgents = computed(() => {
  const q = search.value.trim().toLowerCase()
  const list = agentsStore.enabledAgents
  if (!q) return list
  return list.filter(a =>
    a.name.toLowerCase().includes(q) ||
    (a.description || '').toLowerCase().includes(q)
  )
})

function pick(id: string) {
  agentsStore.setActiveAgent(id)
  show.value = false
  search.value = ''
}

function onOpen(v: boolean) {
  if (v) search.value = ''
}
</script>

<template>
  <NPopover
    :show="show"
    @update:show="(v: boolean) => { show = v; onOpen(v); }"
    trigger="click"
    placement="top-start"
    :show-arrow="false"
    raw
    :overlap="false"
  >
    <template #trigger>
      <button class="yi-agent-trigger" type="button">
        <img
          v-if="currentAgent?.avatar"
          :src="currentAgent.avatar"
          class="yi-agent-avatar"
          alt=""
        />
        <span
          v-else
          class="yi-agent-avatar-placeholder"
          :style="{ background: currentAgent?.color || '#6366f1' }"
        >{{ (currentAgent?.name || 'A')[0] }}</span>
        <span class="yi-agent-label" :title="currentAgent?.name || 'Agent'">{{ currentAgent?.name || 'Agent' }}</span>
        <svg class="yi-agent-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </template>
    <div class="yi-agent-pop" @click.stop>
      <div class="yi-agent-pop-head">
        <NInput
          v-model:value="search"
          :placeholder="t('models.searchPlaceholder') || 'Search...'"
          clearable
          size="small"
          class="yi-agent-search"
        />
      </div>
      <NScrollbar style="max-height: 360px;">
        <div class="yi-agent-list">
          <div
            v-for="agent in filteredAgents"
            :key="agent.id"
            class="yi-agent-item"
            :class="{ active: agent.id === agentsStore.activeAgentId }"
            @click="pick(agent.id)"
          >
            <img
              v-if="agent.avatar"
              :src="agent.avatar"
              class="yi-agent-item-avatar"
              alt=""
            />
            <span
              v-else
              class="yi-agent-item-avatar-placeholder"
              :style="{ background: agent.color || '#6366f1' }"
            >{{ agent.name[0] }}</span>
            <div class="yi-agent-item-info">
              <span class="yi-agent-item-name">{{ agent.name }}</span>
              <span v-if="agent.description" class="yi-agent-item-desc">{{ agent.description }}</span>
            </div>
            <svg
              v-if="agent.id === agentsStore.activeAgentId"
              class="yi-agent-check"
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div v-if="filteredAgents.length === 0" class="yi-agent-empty">{{ t('models.noResults') || 'No results' }}</div>
        </div>
      </NScrollbar>
    </div>
  </NPopover>
</template>

<style scoped lang="scss">
@use "@/styles/variables" as *;

.yi-agent-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 8px;
  border-radius: $radius-sm;
  background: transparent;
  border: 1px solid transparent;
  color: $text-secondary;
  font-size: 12px;
  cursor: pointer;
  max-width: 220px;

  &:hover { background: rgba(var(--accent-primary-rgb), 0.06); color: $text-primary; }
}
.yi-agent-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.yi-agent-avatar-placeholder {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}
.yi-agent-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}
.yi-agent-arrow { color: $text-muted; flex-shrink: 0; }

.yi-agent-pop {
  width: 320px;
  background: $bg-card;
  border: 1px solid $border-color;
  border-radius: $radius-md;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  overflow: hidden;
  .yi-agent-pop-head { padding: 8px; border-bottom: 1px solid $border-color; }
}
.yi-agent-list { padding: 4px 0; }
.yi-agent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: $text-primary;
  border-radius: $radius-sm;
  cursor: pointer;
  transition: background-color $transition-fast;
  &:hover { background: rgba(var(--accent-primary-rgb), 0.08); }
  &.active { background: rgba(var(--accent-primary-rgb), 0.12); font-weight: 500; }
}
.yi-agent-item-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.yi-agent-item-avatar-placeholder {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}
.yi-agent-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.yi-agent-item-name { font-size: 13px; }
.yi-agent-item-desc {
  font-size: 11px;
  color: $text-muted;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.yi-agent-check { flex-shrink: 0; color: var(--accent-primary-rgb); }
.yi-agent-empty { padding: 24px; text-align: center; font-size: 13px; color: $text-muted; }
</style>
