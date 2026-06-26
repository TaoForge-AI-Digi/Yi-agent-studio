<script setup lang="ts">
import { ref, computed } from 'vue'
import { NInput, NTag, NEmpty, NButton, useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useAgentsStore } from '@/stores/yi/agents'

const { t } = useI18n()
const message = useMessage()
const agentsStore = useAgentsStore()

const searchQuery = ref('')
const selectedId = ref<string | null>(null)

const filteredAgents = computed(() => {
  const q = searchQuery.value.toLowerCase()
  return agentsStore.sortedAgents.filter(a =>
    !q || a.name.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q)
  )
})

const emit = defineEmits<{
  select: [id: string]
  edit: [id: string]
  create: []
}>()

function handleSelect(id: string) {
  selectedId.value = id
  emit('select', id)
}

function handleDelete(id: string) {
  const agent = agentsStore.getAgent(id)
  if (!agent || agent.builtIn) return
  if (confirm(t('agents.deleteConfirmContent', { name: agent.name }))) {
    agentsStore.deleteAgent(id)
    message.success(t('agents.deleted'))
  }
}
</script>

<template>
  <div class="agent-list">
    <div class="agent-list-header">
      <n-input
        v-model:value="searchQuery"
        :placeholder="t('agents.search')"
        clearable
        size="small"
      />
      <n-button type="primary" size="small" @click="emit('create')">
        {{ t('agents.create') }}
      </n-button>
    </div>
    <div class="agent-list-items">
      <n-empty v-if="filteredAgents.length === 0" :description="t('agents.empty')" />
      <div
        v-for="agent in filteredAgents"
        :key="agent.id"
        class="agent-list-item"
        :class="{ selected: selectedId === agent.id }"
        @click="handleSelect(agent.id)"
      >
        <div class="agent-list-item-avatar" :style="{ borderColor: agent.color || '#6366f1' }">
          <img v-if="agent.avatar" :src="agent.avatar" class="avatar-img" />
          <span v-else class="avatar-text">{{ agent.name?.charAt(0) || '?' }}</span>
        </div>
        <div class="agent-list-item-info">
          <div class="agent-list-item-name">
            {{ agent.name }}
            <n-tag v-if="agent.builtIn" size="tiny" type="info" :bordered="false">
              {{ t('agents.builtIn') }}
            </n-tag>
          </div>
          <div class="agent-list-item-desc">{{ agent.description }}</div>
        </div>
        <div class="agent-list-item-actions">
          <n-button quaternary size="tiny" @click.stop="emit('edit', agent.id)">✏️</n-button>
          <n-button v-if="!agent.builtIn" quaternary size="tiny" @click.stop="handleDelete(agent.id)">🗑️</n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.agent-list { display: flex; flex-direction: column; gap: 8px; height: 100%; }
.agent-list-header { display: flex; gap: 8px; }
.agent-list-items { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.agent-list-item { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
.agent-list-item:hover { background: rgba(255, 255, 255, 0.05); }
.agent-list-item.selected { background: rgba(255, 255, 255, 0.1); }
.agent-list-item-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
}
.avatar-img { width: 100%; height: 100%; object-fit: cover; }
.avatar-text { font-size: 14px; font-weight: 600; opacity: 0.6; }
.agent-list-item-info { flex: 1; min-width: 0; }
.agent-list-item-name { font-weight: 500; display: flex; align-items: center; gap: 6px; font-size: 13px; }
.agent-list-item-desc { font-size: 12px; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.agent-list-item-actions { display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s; }
.agent-list-item:hover .agent-list-item-actions { opacity: 1; }
</style>
