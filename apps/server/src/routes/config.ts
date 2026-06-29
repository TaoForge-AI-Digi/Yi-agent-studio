import { Hono } from 'hono'
import { configStore } from '../store/config.js'

const config = new Hono()

config.get('/', (c) => {
  const sections = c.req.query('sections')
  const all = configStore.getAll()
  if (sections) {
    const keys = sections.split(',').map(s => s.trim()).filter(Boolean)
    const filtered: Record<string, unknown> = {}
    for (const key of keys) {
      if (key in all) filtered[key] = all[key]
    }
    return c.json(filtered)
  }
  return c.json(all)
})

config.put('/', async (c) => {
  const body = await c.req.json()
  const { section, values } = body
  if (!section || !values) return c.json({ error: 'section and values required' }, 400)
  configStore.updateSection(section, values)
  return c.json({ ok: true })
})

export default config
