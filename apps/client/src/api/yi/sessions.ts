import { request } from '../client'
import type { ProviderApiMode } from './system'

export interface SessionSummary {
  id: string
  profile?: string | null
  source: string
  agent?: string
  agent_mode?: 'global' | 'scoped' | string
  agent_session_id?: string
  agent_native_session_id?: string
  model: string
  provider?: string
  title: string | null
  parent_session_id?: string | null
  fork_point_message_id?: string | null
  parent_title?: string | null
  parent_last_message?: string | null
  parent_last_message_role?: string | null
  preview?: string
  started_at: number
  ended_at: number | null
  last_active?: number
  message_count: number
  tool_call_count: number
  input_tokens: number
  output_tokens: number
  cache_read_tokens: number
  cache_write_tokens: number
  reasoning_tokens: number
  billing_provider: string | null
  estimated_cost_usd: number
  actual_cost_usd: number | null
  cost_status: string
  workspace?: string | null
  webui_imported?: boolean
}

export interface SessionDetail extends SessionSummary { messages: YiMessage[] }
export interface SessionContextMessage { id: number; role: string; content: string; timestamp: number }
export interface SessionContext { session_id: string; messages: SessionContextMessage[]; message_count: number }
export interface PaginatedSessionMessages { session: SessionSummary; messages: YiMessage[]; total: number; offset: number; limit: number; hasMore: boolean }
export interface SessionSearchResult extends SessionSummary { matched_message_id: number | null; snippet: string; rank: number }
export interface YiMessage { id: number; session_id: string; role: string; content: string; timestamp: number; token_count: number | null; finish_reason: string | null; reasoning: string | null; tool_name: string | null; tool_call_id: string | null }
export interface BatchDeleteSessionTarget { id: string; profile?: string | null }
export interface UsageStatsResponse { total_input_tokens: number; total_output_tokens: number; [key: string]: unknown }

export async function fetchSessions(source?: string, limit?: number, profile?: string): Promise<SessionSummary[]> {
  const params = new URLSearchParams()
  if (source) params.set('source', source)
  if (limit != null) params.set('limit', String(limit))
  if (profile) params.set('profile', profile)
  const query = params.toString()
  return request<SessionSummary[]>(`/api/yi/sessions${query ? `?${query}` : ''}`)
}

export async function fetchYiSessions(source?: string, limit?: number, profile?: string): Promise<SessionSummary[]> {
  return fetchSessions(source, limit, profile)
}

export async function searchSessions(query: string, source?: string, limit?: number, profile?: string): Promise<SessionSearchResult[]> {
  const all = await fetchSessions(source, limit, profile)
  if (!query.trim()) return all.map(s => ({ ...s, matched_message_id: null, snippet: s.preview || '', rank: 0 }))
  const lower = query.toLowerCase()
  return all.filter(s => (s.title || '').toLowerCase().includes(lower) || (s.preview || '').toLowerCase().includes(lower))
    .map(s => ({ ...s, matched_message_id: null, snippet: s.preview || '', rank: 0 }))
}

export async function fetchSession(sessionId: string): Promise<SessionDetail | null> {
  try {
    return request<SessionDetail>(`/api/yi/sessions/${encodeURIComponent(sessionId)}`)
  } catch { return null }
}

export async function fetchSessionContext(sessionId: string): Promise<SessionContext | null> {
  try {
    const msgs = await fetchSessionMessagesPage(sessionId, 0, 50)
    if (!msgs) return null
    return {
      session_id: sessionId,
      messages: msgs.messages.map(m => ({ id: m.id, role: m.role, content: m.content, timestamp: m.timestamp })),
      message_count: msgs.total,
    }
  } catch { return null }
}

export async function fetchSessionMessagesPage(sessionId: string, offset: number, limit: number, profile?: string): Promise<PaginatedSessionMessages | null> {
  try {
    const params = new URLSearchParams()
    params.set('offset', String(offset))
    params.set('limit', String(limit))
    const query = params.toString()
    return request<PaginatedSessionMessages>(`/api/yi/sessions/${encodeURIComponent(sessionId)}/messages?${query}`)
  } catch { return null }
}

export async function fetchYiSession(sessionId: string): Promise<SessionDetail | null> {
  return fetchSession(sessionId)
}

export async function deleteSession(sessionId: string, profile?: string): Promise<boolean> {
  try {
    await request(`/api/yi/sessions/${encodeURIComponent(sessionId)}`, { method: 'DELETE' })
    return true
  } catch { return false }
}

export async function importHermesSession() { return { ok: false, imported: false } }

export async function batchDeleteSessions(sessions: BatchDeleteSessionTarget[]): Promise<{ deleted: number; failed: number; errors: { id: string; error: string }[] }> {
  try {
    return request<{ deleted: number; failed: number; errors: { id: string; error: string }[] }>('/api/yi/sessions/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids: sessions.map(s => s.id) }),
    })
  } catch { return { deleted: 0, failed: sessions.length, errors: sessions.map(s => ({ id: s.id, error: 'Request failed' })) } }
}

export async function renameSession(sessionId: string, title: string): Promise<boolean> {
  try {
    await request(`/api/yi/sessions/${encodeURIComponent(sessionId)}/rename`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    })
    return true
  } catch { return false }
}

export async function setSessionWorkspace(sessionId: string, workspace: string): Promise<boolean> {
  try {
    await request(`/api/yi/sessions/${encodeURIComponent(sessionId)}/workspace`, {
      method: 'PUT',
      body: JSON.stringify({ workspace }),
    })
    return true
  } catch { return false }
}

export async function setSessionModel(sessionId: string, model: string, provider: string, apiMode?: ProviderApiMode): Promise<boolean> {
  try {
    await request(`/api/yi/sessions/${encodeURIComponent(sessionId)}/model`, {
      method: 'PUT',
      body: JSON.stringify({ model, provider, api_mode: apiMode }),
    })
    return true
  } catch { return false }
}

export async function exportSession(sessionId: string, format?: string): Promise<void> {
  const params = new URLSearchParams()
  if (format) params.set('format', format)
  const query = params.toString()
  const url = `/api/yi/sessions/${encodeURIComponent(sessionId)}/export${query ? `?${query}` : ''}`
  window.open(url, '_blank')
}

export async function fetchUsageStats(): Promise<UsageStatsResponse> {
  return { total_input_tokens: 0, total_output_tokens: 0 }
}

export async function fetchSessionUsage(): Promise<Record<string, { input_tokens: number; output_tokens: number }>> {
  return {}
}

export async function fetchSessionUsageSingle() { return null }

export async function fetchContextLength(): Promise<number> {
  try {
    const res = await request<{ data: { context_limit: number } }>('/api/yi/model-context')
    return res.data?.context_limit || 0
  } catch { return 0 }
}
