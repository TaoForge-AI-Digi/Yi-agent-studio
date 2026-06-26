<script setup lang="ts">
import { computed } from 'vue'
import { NPopover, NButton, NList, NListItem } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useAgentsStore } from '@/stores/yi/agents'

const { t } = useI18n()
const agentsStore = useAgentsStore()

const currentAgent = computed(() => agentsStore.activeAgent)

function selectAgent(id: string) {
  agentsStore.setActiveAgent(id)
}
</script>

<template>
  <n-popover trigger="click" placement="bottom-start" :width="280">
    <template #trigger>
      <n-button quaternary size="tiny" class="agent-selector-trigger">
        <span class="agent-dot" :style="{ background: currentAgent?.color || '#6366f1' }"></span>
        {{ currentAgent?.name || 'Agent' }}
      </n-button>
    </template>
    <n-list :show-divider="false" hoverable clickable>
      <n-list-item
        v-for="agent in agentsStore.enabledAgents"
        :key="agent.id"
        :class="{ active: agent.id === agentsStore.activeAgentId }"
        @click="selectAgent(agent.id)"
      >
        <div class="agent-option">
          <span class="agent-dot" :style="{ background: agent.color || '#6366f1' }"></span>
          <div class="agent-option-info">
            <div class="agent-option-name">{{ agent.name }}</div>
            <div class="agent-option-desc">{{ agent.description }}</div>
          </div>
        </div>
      </n-list-item>
    </n-list>
  </n-popover>
</template>

<style scoped>
.agent-selector-trigger { display: flex; align-items: center; gap: 6px; }
.agent-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.agent-option { display: flex; align-items: center; gap: 10px; }
.agent-option-info { flex: 1; min-width: 0; }
.agent-option-name { font-weight: 500; font-size: 13px; }
.agent-option-desc { font-size: 11px; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
