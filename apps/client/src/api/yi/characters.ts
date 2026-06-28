import type { Agent, AgentConfig } from '@/types/agent'

const BASE = '/api/yi/characters'

export async function fetchCharacters(): Promise<Agent[]> {
  const res = await fetch(BASE)
  if (!res.ok) throw new Error('Failed to fetch characters')
  return res.json()
}

export async function createCharacterApi(config: AgentConfig): Promise<Agent> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  if (!res.ok) throw new Error('Failed to create character')
  return res.json()
}

export async function updateCharacterApi(id: string, patch: Partial<AgentConfig>): Promise<Agent> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('Failed to update character')
  return res.json()
}

export async function deleteCharacterApi(id: string): Promise<void> {
  await fetch(`${BASE}/${id}`, { method: 'DELETE' })
}
