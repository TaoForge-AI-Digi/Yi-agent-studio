import { getDb } from './schema.js'

export interface SessionRow {
  id: string
  profile: string
  source: string
  agent: string | null
  coding_agent_id: string | null
  coding_agent_mode: string | null
  title: string
  workspace: string | null
  model: string | null
  provider: string | null
  base_url: string | null
  api_key: string | null
  api_mode: string | null
  parent_session_id: string | null
  fork_point_message_id: string | null
  parent_title: string | null
  parent_last_message: string | null
  parent_last_message_role: string | null
  created_at: number
  updated_at: number
  ended_at: number | null
  last_active_at: number | null
  message_count: number
  input_tokens: number
  output_tokens: number
  context_tokens: number | null
}

export interface MessageRow {
  id: number
  session_id: string
  role: string
  content: string
  reasoning: string | null
  tool_name: string | null
  tool_call_id: string | null
  tool_args: string | null
  tool_result: string | null
  tool_status: string | null
  finish_reason: string | null
  run_marker: string | null
  token_count: number | null
  created_at: number
}

export function toSessionSummary(s: SessionRow): Record<string, unknown> {
  return {
    id: s.id,
    profile: s.profile,
    source: s.source,
    agent: s.agent,
    agent_mode: s.coding_agent_mode,
    agent_session_id: s.coding_agent_id ? `${s.id}_agent` : null,
    model: s.model || '',
    provider: s.provider || '',
    title: s.title || null,
    parent_session_id: s.parent_session_id,
    fork_point_message_id: s.fork_point_message_id,
    parent_title: s.parent_title,
    parent_last_message: s.parent_last_message,
    parent_last_message_role: s.parent_last_message_role,
    started_at: Math.round(s.created_at / 1000),
    ended_at: s.ended_at ? Math.round(s.ended_at / 1000) : null,
    last_active: s.last_active_at ? Math.round(s.last_active_at / 1000) : Math.round(s.updated_at / 1000),
    message_count: s.message_count,
    input_tokens: s.input_tokens,
    output_tokens: s.output_tokens,
    workspace: s.workspace,
  }
}

export function toMessageRow(m: MessageRow): Record<string, unknown> {
  return {
    id: m.id,
    session_id: m.session_id,
    role: m.role,
    content: m.content,
    reasoning: m.reasoning,
    tool_name: m.tool_name,
    tool_call_id: m.tool_call_id,
    tool_args: m.tool_args ? JSON.parse(m.tool_args) : null,
    tool_result: m.tool_result ? JSON.parse(m.tool_result) : null,
    tool_status: m.tool_status,
    finish_reason: m.finish_reason,
    run_marker: m.run_marker,
    token_count: m.token_count,
    timestamp: Math.round(m.created_at / 1000),
  }
}

export const sessionStore = {
  list(profile?: string | null, source?: string | null, limit = 50): SessionRow[] {
    const db = getDb()
    const conditions: string[] = []
    const params: unknown[] = []
    if (profile) { conditions.push('profile = ?'); params.push(profile) }
    if (source) { conditions.push('source = ?'); params.push(source) }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const rows = db.prepare(`SELECT * FROM sessions ${where} ORDER BY updated_at DESC LIMIT ?`).all(...params, limit) as SessionRow[]
    return rows
  },

  getById(id: string): SessionRow | null {
    const db = getDb()
    return db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRow | null
  },

  create(data: Partial<SessionRow> & { id: string }): SessionRow {
    const db = getDb()
    const now = Date.now()
    const row: SessionRow = {
      id: data.id,
      profile: data.profile || 'default',
      source: data.source || 'cli',
      agent: data.agent || null,
      coding_agent_id: data.coding_agent_id || null,
      coding_agent_mode: data.coding_agent_mode || null,
      title: data.title || '',
      workspace: data.workspace || null,
      model: data.model || null,
      provider: data.provider || null,
      base_url: data.base_url || null,
      api_key: data.api_key || null,
      api_mode: data.api_mode || null,
      parent_session_id: data.parent_session_id || null,
      fork_point_message_id: data.fork_point_message_id || null,
      parent_title: data.parent_title || null,
      parent_last_message: data.parent_last_message || null,
      parent_last_message_role: data.parent_last_message_role || null,
      created_at: data.created_at || now,
      updated_at: data.updated_at || now,
      ended_at: data.ended_at || null,
      last_active_at: data.last_active_at || null,
      message_count: data.message_count || 0,
      input_tokens: data.input_tokens || 0,
      output_tokens: data.output_tokens || 0,
      context_tokens: data.context_tokens || null,
    }
    db.prepare(`INSERT INTO sessions (id, profile, source, agent, coding_agent_id, coding_agent_mode, title, workspace, model, provider, base_url, api_key, api_mode, parent_session_id, fork_point_message_id, parent_title, parent_last_message, parent_last_message_role, created_at, updated_at, ended_at, last_active_at, message_count, input_tokens, output_tokens, context_tokens) VALUES (@id, @profile, @source, @agent, @coding_agent_id, @coding_agent_mode, @title, @workspace, @model, @provider, @base_url, @api_key, @api_mode, @parent_session_id, @fork_point_message_id, @parent_title, @parent_last_message, @parent_last_message_role, @created_at, @updated_at, @ended_at, @last_active_at, @message_count, @input_tokens, @output_tokens, @context_tokens)`).run(row)
    return row
  },

  update(id: string, patch: Partial<SessionRow>): SessionRow | null {
    const db = getDb()
    const existing = sessionStore.getById(id)
    if (!existing) return null
    const updated = { ...existing, ...patch, id, updated_at: Date.now() }
    db.prepare(`UPDATE sessions SET profile=@profile, source=@source, agent=@agent, coding_agent_id=@coding_agent_id, coding_agent_mode=@coding_agent_mode, title=@title, workspace=@workspace, model=@model, provider=@provider, base_url=@base_url, api_key=@api_key, api_mode=@api_mode, parent_session_id=@parent_session_id, fork_point_message_id=@fork_point_message_id, parent_title=@parent_title, parent_last_message=@parent_last_message, parent_last_message_role=@parent_last_message_role, updated_at=@updated_at, ended_at=@ended_at, last_active_at=@last_active_at, message_count=@message_count, input_tokens=@input_tokens, output_tokens=@output_tokens, context_tokens=@context_tokens WHERE id=@id`).run(updated)
    return updated
  },

  delete(id: string): boolean {
    const db = getDb()
    const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(id)
    return result.changes > 0
  },

  batchDelete(ids: string[]): number {
    const db = getDb()
    const placeholders = ids.map(() => '?').join(',')
    const result = db.prepare(`DELETE FROM sessions WHERE id IN (${placeholders})`).run(...ids)
    return result.changes
  },

  getMessages(sessionId: string, offset = 0, limit = 150): MessageRow[] {
    const db = getDb()
    return db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY id ASC LIMIT ? OFFSET ?').all(sessionId, limit, offset) as MessageRow[]
  },

  getMessageCount(sessionId: string): number {
    const db = getDb()
    const row = db.prepare('SELECT COUNT(*) as count FROM messages WHERE session_id = ?').get(sessionId) as { count: number }
    return row.count
  },

  addMessage(sessionId: string, data: Partial<MessageRow> & { role: string }): MessageRow {
    const db = getDb()
    const now = Date.now()
    const row: MessageRow = {
      id: 0,
      session_id: sessionId,
      role: data.role,
      content: data.content || '',
      reasoning: data.reasoning || null,
      tool_name: data.tool_name || null,
      tool_call_id: data.tool_call_id || null,
      tool_args: data.tool_args ? (typeof data.tool_args === 'string' ? data.tool_args : JSON.stringify(data.tool_args)) : null,
      tool_result: data.tool_result ? (typeof data.tool_result === 'string' ? data.tool_result : JSON.stringify(data.tool_result)) : null,
      tool_status: data.tool_status || null,
      finish_reason: data.finish_reason || null,
      run_marker: data.run_marker || null,
      token_count: data.token_count || null,
      created_at: now,
    }
    const result = db.prepare(`INSERT INTO messages (session_id, role, content, reasoning, tool_name, tool_call_id, tool_args, tool_result, tool_status, finish_reason, run_marker, token_count, created_at) VALUES (@session_id, @role, @content, @reasoning, @tool_name, @tool_call_id, @tool_args, @tool_result, @tool_status, @finish_reason, @run_marker, @token_count, @created_at)`).run(row)
    row.id = Number(result.lastInsertRowid)

    // Update session message count
    db.prepare('UPDATE sessions SET message_count = message_count + 1, updated_at = ? WHERE id = ?').run(now, sessionId)
    return row
  },
}
