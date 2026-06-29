import { Hono } from 'hono'
import { sessionStore, toSessionSummary, toMessageRow } from '../store/sessions.js'

const sessions = new Hono()

// GET /sessions — list sessions
sessions.get('/', (c) => {
  const profile = c.req.query('profile') || null
  const source = c.req.query('source') || null
  const limit = parseInt(c.req.query('limit') || '50', 10)
  const rows = sessionStore.list(profile, source, limit)
  return c.json(rows.map(toSessionSummary))
})

// GET /sessions/:id — get session detail
sessions.get('/:id', (c) => {
  const id = c.req.param('id')
  const session = sessionStore.getById(id)
  if (!session) return c.json({ error: 'Session not found' }, 404)
  return c.json({
    ...toSessionSummary(session),
    messages: [],
  })
})

// GET /sessions/:id/messages — paginated messages
sessions.get('/:id/messages', (c) => {
  const id = c.req.param('id')
  const session = sessionStore.getById(id)
  if (!session) return c.json({ error: 'Session not found' }, 404)

  const offset = parseInt(c.req.query('offset') || '0', 10)
  const limit = parseInt(c.req.query('limit') || '150', 10)
  const messages = sessionStore.getMessages(id, offset, limit)
  const total = sessionStore.getMessageCount(id)

  return c.json({
    session: toSessionSummary(session),
    messages: messages.map(toMessageRow),
    total,
    offset,
    limit,
    hasMore: offset + messages.length < total,
  })
})

// POST /sessions — create session
sessions.post('/', async (c) => {
  const body = await c.req.json()
  const session = sessionStore.create({
    id: body.id,
    profile: body.profile || 'default',
    source: body.source || 'cli',
    agent: body.agent || null,
    coding_agent_id: body.coding_agent_id || null,
    coding_agent_mode: body.coding_agent_mode || null,
    title: body.title || '',
    model: body.model || null,
    provider: body.provider || null,
    workspace: body.workspace || null,
    parent_session_id: body.parent_session_id || null,
  })
  return c.json(toSessionSummary(session), 201)
})

// PUT /sessions/:id/rename
sessions.put('/:id/rename', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const updated = sessionStore.update(id, { title: body.title })
  if (!updated) return c.json({ error: 'Session not found' }, 404)
  return c.json({ ok: true })
})

// PUT /sessions/:id/workspace
sessions.put('/:id/workspace', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const updated = sessionStore.update(id, { workspace: body.workspace || null })
  if (!updated) return c.json({ error: 'Session not found' }, 404)
  return c.json({ ok: true })
})

// PUT /sessions/:id/model
sessions.put('/:id/model', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const updated = sessionStore.update(id, {
    model: body.model || null,
    provider: body.provider || null,
    api_mode: body.api_mode || null,
  })
  if (!updated) return c.json({ error: 'Session not found' }, 404)
  return c.json({ ok: true })
})

// DELETE /sessions/:id
sessions.delete('/:id', (c) => {
  const id = c.req.param('id')
  const ok = sessionStore.delete(id)
  if (!ok) return c.json({ error: 'Session not found' }, 404)
  return c.json({ ok: true })
})

// POST /sessions/batch-delete
sessions.post('/batch-delete', async (c) => {
  const body = await c.req.json()
  const ids: string[] = body.ids || (body.sessions || []).map((s: { id: string }) => s.id)
  const deleted = sessionStore.batchDelete(ids)
  return c.json({ deleted, failed: 0, errors: [] })
})

// GET /sessions/:id/export
sessions.get('/:id/export', (c) => {
  const id = c.req.param('id')
  const session = sessionStore.getById(id)
  if (!session) return c.json({ error: 'Session not found' }, 404)
  const messages = sessionStore.getMessages(id, 0, 10000)
  return c.json({
    session: toSessionSummary(session),
    messages: messages.map(toMessageRow),
  })
})

export default sessions
