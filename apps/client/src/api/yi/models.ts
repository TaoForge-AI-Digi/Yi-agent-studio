import type { YiProviderConfig } from '@/types/model'

const BASE = '/api/yi/models'

export async function fetchProviders(): Promise<YiProviderConfig[]> {
  const res = await fetch(BASE)
  if (!res.ok) throw new Error('Failed to fetch providers')
  return res.json()
}

export async function createProviderApi(data: Omit<YiProviderConfig, 'enabled'>): Promise<YiProviderConfig> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create provider')
  return res.json()
}

export async function updateProviderApi(id: string, patch: Partial<YiProviderConfig>): Promise<YiProviderConfig> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('Failed to update provider')
  return res.json()
}

export async function deleteProviderApi(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete provider')
}
