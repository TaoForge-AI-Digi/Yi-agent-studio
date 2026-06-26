<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AgentList from '@/components/yi/agents/AgentList.vue'
import AgentForm from '@/components/yi/agents/AgentForm.vue'
import { useAgentsStore } from '@/stores/yi/agents'
import type { Agent, AgentConfig } from '@/types/agent'

const { t } = useI18n()
const agentsStore = useAgentsStore()

const showForm = ref(false)
const editingAgent = ref<Agent | null>(null)
const showSidebar = ref(true)

let mobileQuery: MediaQueryList | null = null

function handleCreate() {
  editingAgent.value = null
  showForm.value = true
}

function handleEdit(id: string) {
  const agent = agentsStore.getAgent(id)
  if (agent) {
    editingAgent.value = agent
    showForm.value = true
  }
}

function handleSelect(id: string) {
  editingAgent.value = agentsStore.getAgent(id) || null
  showForm.value = true
}

function handleSave(config: AgentConfig) {
  if (editingAgent.value) {
    agentsStore.updateAgent(editingAgent.value.id, config)
  } else {
    agentsStore.createAgent(config)
  }
  showForm.value = false
  editingAgent.value = null
}

function handleCancel() {
  showForm.value = false
  editingAgent.value = null
}

function handleMobileChange(e: MediaQueryListEvent | MediaQueryList) {
  showSidebar.value = !e.matches
}

onMounted(() => {
  mobileQuery = window.matchMedia('(max-width: 768px)')
  handleMobileChange(mobileQuery)
  mobileQuery.addEventListener('change', handleMobileChange)
})

onUnmounted(() => {
  mobileQuery?.removeEventListener('change', handleMobileChange)
})
</script>

<template>
  <div class="agents-view">
    <div class="agents-view-list" v-show="showSidebar">
      <AgentList
        @create="handleCreate"
        @edit="handleEdit"
        @select="handleSelect"
      />
    </div>
    <div class="agents-view-detail">
      <AgentForm
        v-if="editingAgent || showForm"
        :key="editingAgent?.id || 'new'"
        :agent="editingAgent"
        @save="handleSave"
        @cancel="handleCancel"
      />
      <div v-else class="agents-view-empty">
        {{ t('agents.selectOrCreate') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.agents-view { display: flex; height: 100%; gap: 16px; padding: 16px; }
.agents-view-list { width: 300px; flex-shrink: 0; }
.agents-view-detail { flex: 1; overflow-y: auto; }
.agents-view-empty { display: flex; align-items: center; justify-content: center; height: 100%; opacity: 0.5; }
@media (max-width: 768px) {
  .agents-view { flex-direction: column; }
  .agents-view-list { width: 100%; height: 200px; }
}
</style>
