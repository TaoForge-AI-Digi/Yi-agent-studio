import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import characters from './routes/characters.js'
import models from './routes/models.js'
import { seedBuiltinAgents } from './store/characters.js'
import { seedBuiltinProviders } from './store/models.js'

seedBuiltinAgents()
seedBuiltinProviders()

const app = new Hono()

app.use('*', cors())

app.route('/yi/characters', characters)
app.route('/yi/models', models)

app.get('/health', (c) => c.json({ ok: true }))

const port = 3001
serve({ fetch: app.fetch, port }, () => {
  console.log(`Yi server running on http://localhost:${port}`)
})
