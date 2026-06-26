import type { Agent, AgentConfig } from '@/types/agent'
import { BUILTIN_AGENTS } from '@/types/agent'

const STORAGE_KEY = 'yi_agents'

export async function fetchAgents(): Promise<Agent[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return [...BUILTIN_AGENTS]
    const custom: Agent[] = JSON.parse(raw)
    return [...BUILTIN_AGENTS, ...custom]
  } catch {
    return [...BUILTIN_AGENTS]
  }
}

export async function createAgentApi(config: AgentConfig): Promise<Agent> {
  const agent: Agent = {
    ...config,
    id: crypto.randomUUID(),
    builtIn: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  const existing: Agent[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  existing.push(agent)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
  return agent
}

export async function updateAgentApi(id: string, patch: Partial<AgentConfig>): Promise<Agent> {
  const existing: Agent[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  const idx = existing.findIndex(a => a.id === id)
  if (idx >= 0) {
    existing[idx] = { ...existing[idx], ...patch, updatedAt: Date.now() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    return existing[idx]
  }
  const builtIn = BUILTIN_AGENTS.find(a => a.id === id)
  if (builtIn) {
    return { ...builtIn, ...patch, updatedAt: Date.now() }
  }
  throw new Error(`Agent ${id} not found`)
}

export async function deleteAgentApi(id: string): Promise<void> {
  const existing: Agent[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  const filtered = existing.filter(a => a.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}
