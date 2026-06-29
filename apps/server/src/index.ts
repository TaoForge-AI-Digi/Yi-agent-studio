import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { Server } from 'socket.io'
import characters from './routes/characters.js'
import models from './routes/models.js'
import sessions from './routes/sessions.js'
import configRoute from './routes/config.js'
import filesRoute from './routes/files.js'
import downloadRoute from './routes/download.js'
import uploadRoute from './routes/upload.js'
import profilesRoute from './routes/profiles.js'
import availableModelsRoute from './routes/available-models.js'
import { seedBuiltinAgents } from './store/characters.js'
import { seedBuiltinProviders } from './store/models.js'
import { registerChatSocket } from './ws/chat-socket.js'
import { getDb } from './store/schema.js'

seedBuiltinAgents()
seedBuiltinProviders()
getDb()

const app = new Hono()

app.use('*', cors())

app.route('/yi/characters', characters)
app.route('/yi/models', models)
app.route('/yi/sessions', sessions)
app.route('/yi/config', configRoute)
app.route('/yi/files', filesRoute)
app.route('/yi/download', downloadRoute)
app.route('/yi/profiles', profilesRoute)
app.route('/yi/available-models', availableModelsRoute)
app.route('/upload', uploadRoute)

app.get('/health', (c) => c.json({ ok: true, status: 'ok', webui_version: '0.1.0' }))

const port = 3001
const httpServer = serve({ fetch: app.fetch, port }, () => {
  console.log(`Yi server running on http://localhost:${port}`)
})

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
})

io.on('connection', (socket) => {
  registerChatSocket(io, socket)
})
