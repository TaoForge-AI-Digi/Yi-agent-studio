import { Hono } from 'hono'
import { modelStore } from '../store/models.js'
import { randomUUID } from 'crypto'

const models = new Hono()

models.get('/', (c) => {
  return c.json(modelStore.getAll())
})

models.post('/', async (c) => {
  const body = await c.req.json()
  const provider = modelStore.create({
    id: body.id || randomUUID(),
    name: body.name || 'Untitled Provider',
    baseUrl: body.baseUrl || '',
    apiKey: body.apiKey || '',
    models: body.models || [],
    enabled: body.enabled ?? true,
    builtin: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  })
  return c.json(provider, 201)
})

models.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const provider = modelStore.update(id, body)
  if (!provider) return c.json({ error: 'Provider not found' }, 404)
  return c.json(provider)
})

models.delete('/:id', (c) => {
  const id = c.req.param('id')
  const provider = modelStore.getById(id)
  if (provider?.builtin) return c.json({ error: 'Cannot delete builtin provider' }, 400)
  const ok = modelStore.delete(id)
  if (!ok) return c.json({ error: 'Provider not found' }, 404)
  return c.json({ ok: true })
})

export default models
