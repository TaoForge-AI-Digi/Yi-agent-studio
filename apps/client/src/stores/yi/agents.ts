import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Agent, AgentConfig } from '@/types/agent'
import { BUILTIN_AGENTS } from '@/types/agent'

const STORAGE_KEY = 'yi_agents'

function loadAgents(): Agent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...BUILTIN_AGENTS]
    const custom: Agent[] = JSON.parse(raw)
    return [...BUILTIN_AGENTS, ...custom]
  } catch {
    return [...BUILTIN_AGENTS]
  }
}

function saveAllCustom(agents: Agent[]) {
  const custom = agents.filter(a => !a.builtIn)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom))
}

export const useAgentsStore = defineStore('agents', () => {
  const agents = ref<Agent[]>(loadAgents())
  const activeAgentId = ref<string>('general')

  const sortedAgents = computed(() =>
    [...agents.value].sort((a, b) => {
      if (a.builtIn && !b.builtIn) return -1
      if (!a.builtIn && b.builtIn) return 1
      return (a.name || '').localeCompare(b.name || '')
    })
  )

  const enabledAgents = computed(() =>
    sortedAgents.value.filter(a => a.enabled !== false)
  )

  const activeAgent = computed(() =>
    agents.value.find(a => a.id === activeAgentId.value) || agents.value[0]
  )

  function getAgent(id: string): Agent | undefined {
    return agents.value.find(a => a.id === id)
  }

  function createAgent(config: AgentConfig): Agent {
    const agent: Agent = {
      ...config,
      id: crypto.randomUUID(),
      builtIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    agents.value.push(agent)
    saveAllCustom(agents.value)
    return agent
  }

  function updateAgent(id: string, patch: Partial<AgentConfig>) {
    const idx = agents.value.findIndex(a => a.id === id)
    if (idx === -1) return
    agents.value[idx] = { ...agents.value[idx], ...patch, updatedAt: Date.now() }
    saveAllCustom(agents.value)
  }

  function deleteAgent(id: string) {
    const agent = agents.value.find(a => a.id === id)
    if (!agent || agent.builtIn) return
    agents.value = agents.value.filter(a => a.id !== id)
    if (activeAgentId.value === id) activeAgentId.value = 'general'
    saveAllCustom(agents.value)
  }

  function duplicateAgent(id: string): Agent | undefined {
    const source = getAgent(id)
    if (!source) return
    return createAgent({
      ...source,
      name: `${source.name} (copy)`,
      builtIn: undefined,
    })
  }

  function setActiveAgent(id: string) {
    if (getAgent(id)) activeAgentId.value = id
  }

  return {
    agents,
    sortedAgents,
    enabledAgents,
    activeAgent,
    activeAgentId,
    getAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    duplicateAgent,
    setActiveAgent,
  }
})
