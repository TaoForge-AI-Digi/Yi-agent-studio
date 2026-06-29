import { Hono } from 'hono'

const profiles = new Hono()

profiles.get('/', (c) => {
  return c.json({
    profiles: [
      { name: 'default', active: true, model: '', provider: '', alias: 'Default', gatewayStatus: 'stopped' },
    ],
  })
})

profiles.put('/active', async (c) => {
  return c.json({ ok: true })
})

export default profiles
