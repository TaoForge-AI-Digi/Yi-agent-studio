import { Hono } from 'hono'
import { characterMetaStore } from '../store/characters.js'
import { characterStore } from '../character/store.js'
import { randomUUID } from 'crypto'

const characters = new Hono()

const BUILTIN_IDS = ['general', 'coder', 'reviewer', 'explorer']

// --- Metadata CRUD ---

characters.get('/', (c) => {
  return c.json(characterMetaStore.getAll())
})

characters.post('/', async (c) => {
  const body = await c.req.json()
  const character = characterMetaStore.create({
    id: randomUUID(),
    name: body.name || 'Untitled Character',
    description: body.description || '',
    avatar: body.avatar || '',
    color: body.color || '',
    model: body.model || '',
    provider: body.provider || '',
    tools: body.tools || {},
    permissions: body.permissions || {},
    maxSteps: body.maxSteps ?? 10,
    mode: body.mode || 'all',
    enabled: body.enabled ?? true,
    builtIn: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })
  return c.json(character, 201)
})

characters.put('/:id', async (c) => {
  const id = c.req.param('id')
  if (BUILTIN_IDS.includes(id) && !characterMetaStore.getById(id)) {
    const body = await c.req.json()
    const character = characterMetaStore.create({
      id,
      ...body,
      builtIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return c.json(character)
  }
  const body = await c.req.json()
  const character = characterMetaStore.update(id, body)
  if (!character) return c.json({ error: 'Character not found' }, 404)
  return c.json(character)
})

characters.delete('/:id', (c) => {
  const id = c.req.param('id')
  const ok = characterMetaStore.delete(id)
  if (!ok) return c.json({ error: 'Character not found' }, 404)
  return c.json({ ok: true })
})

// --- Soul / Memory / User content ---

characters.get('/:id/content', (c) => {
  return c.json(characterStore.get(c.req.param('id')))
})

characters.post('/:id/content', async (c) => {
  const id = c.req.param('id')
  const { section, content } = await c.req.json()
  const ok = characterStore.update(id, section, content)
  if (!ok) return c.json({ error: 'Invalid section' }, 400)
  return c.json(characterStore.get(id))
})

export default characters
