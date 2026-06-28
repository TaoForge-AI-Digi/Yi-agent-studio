// Stub: session backend not yet implemented
// Types kept for frontend compilation, all functions return empty/default

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

export async function fetchSessions(): Promise<SessionSummary[]> { return [] }
export async function fetchYiSessions(): Promise<SessionSummary[]> { return [] }
export async function searchSessions(): Promise<SessionSearchResult[]> { return [] }
export async function fetchSession(): Promise<SessionDetail | null> { return null }
export async function fetchSessionContext(): Promise<SessionContext | null> { return null }
export async function fetchSessionMessagesPage(): Promise<PaginatedSessionMessages | null> { return null }
export async function fetchYiSession(): Promise<SessionDetail | null> { return null }
export async function deleteSession(): Promise<boolean> { return false }
export async function importHermesSession() { return { ok: false, imported: false } }
export async function batchDeleteSessions() { return { deleted: 0, failed: 0, errors: [] } }
export async function renameSession(): Promise<boolean> { return false }
export async function setSessionWorkspace(): Promise<boolean> { return false }
export async function setSessionModel(): Promise<boolean> { return false }
export async function exportSession() {}
export async function fetchUsageStats(): Promise<UsageStatsResponse> { return { total_input_tokens: 0, total_output_tokens: 0 } }
export async function fetchSessionUsage(): Promise<Record<string, { input_tokens: number; output_tokens: number }>> { return {} }
export async function fetchSessionUsageSingle() { return null }
export async function fetchContextLength(): Promise<number> { return 0 }
