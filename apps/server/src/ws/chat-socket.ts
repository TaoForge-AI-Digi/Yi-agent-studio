import { Server, Socket } from 'socket.io'
import { sessionStore, toMessageRow, toSessionSummary } from '../store/sessions.js'

// ponytail: simplified in-memory run state, per-socket
const activeRuns = new Map<string, { abort: () => void }>()

export function registerChatSocket(io: Server, socket: Socket) {
  // Client sends a chat message to start a run
  socket.on('chat-run', async (data: Record<string, unknown>, ack?: (resp: unknown) => void) => {
    const sessionId = data.session_id as string || socket.data.currentSessionId
    if (!sessionId) {
      ack?.({ error: 'No session_id' })
      return
    }

    socket.data.currentSessionId = sessionId
    const session = sessionStore.getById(sessionId)

    // Store the user message
    const input = data.input as string || ''
    if (input.trim()) {
      sessionStore.addMessage(sessionId, {
        role: 'user',
        content: input,
      })
    }

    // Emit run.started
    socket.emit('run.started', { session_id: sessionId, status: 'running' })

    // For now, echo back as assistant message (placeholder until real AI integration)
    const assistantMsg = sessionStore.addMessage(sessionId, {
      role: 'assistant',
      content: `收到你的消息: "${input}"\n\n（后端 AI 处理尚未集成，这是一个占位回复）`,
      finish_reason: 'stop',
    })

    socket.emit('message.delta', {
      session_id: sessionId,
      delta: assistantMsg.content,
      id: assistantMsg.id,
    })

    socket.emit('run.completed', {
      session_id: sessionId,
      status: 'completed',
      message_count: sessionStore.getMessageCount(sessionId),
    })

    ack?.({ run_id: `run_${sessionId}_${Date.now()}`, status: 'started' })
  })

  // Client aborts a running run
  socket.on('abort', (data: { session_id?: string }) => {
    const sessionId = data.session_id || socket.data.currentSessionId
    if (sessionId) {
      const run = activeRuns.get(sessionId)
      if (run) {
        run.abort()
        activeRuns.delete(sessionId)
      }
      socket.emit('abort.completed', { session_id: sessionId, synced: true })
    }
  })

  // Client resumes a session (loads messages and state)
  socket.on('resume', async (data: { session_id: string; profile?: string }, ack?: (resp: unknown) => void) => {
    const sessionId = data.session_id
    socket.data.currentSessionId = sessionId
    const session = sessionStore.getById(sessionId)
    if (!session) {
      ack?.({ session_id: sessionId, isWorking: false, messages: [] })
      return
    }

    const messages = sessionStore.getMessages(sessionId, 0, 150)
    const total = sessionStore.getMessageCount(sessionId)

    ack?.({
      session_id: sessionId,
      isWorking: activeRuns.has(sessionId),
      messages: messages.map(toMessageRow),
      messageTotal: total,
      messageLoadedCount: messages.length,
      messageCount: total,
      hasMoreBefore: false,
      inputTokens: session.input_tokens,
      outputTokens: session.output_tokens,
      contextTokens: session.context_tokens,
      parentSessionId: session.parent_session_id,
      forkPointMessageId: session.fork_point_message_id,
      parentTitle: session.parent_title,
      parentLastMessage: session.parent_last_message,
      parentLastMessageRole: session.parent_last_message_role,
    })
  })

  // Cancel queued run
  socket.on('cancel_queued_run', (data: { session_id?: string }) => {
    const sessionId = data.session_id || socket.data.currentSessionId
    if (sessionId) {
      activeRuns.delete(sessionId)
      socket.emit('run.completed', { session_id: sessionId, status: 'cancelled' })
    }
  })

  // Approval respond (stub)
  socket.on('approval.respond', (data: Record<string, unknown>) => {
    socket.emit('approval.resolved', { ...data, status: 'resolved' })
  })

  // Clarify respond (stub)
  socket.on('clarify.respond', (data: Record<string, unknown>) => {
    socket.emit('clarify.resolved', { ...data, status: 'resolved' })
  })
}
