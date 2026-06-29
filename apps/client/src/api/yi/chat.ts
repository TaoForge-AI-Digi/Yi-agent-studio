import { getBaseUrlValue } from '../client'
import { io, Socket } from 'socket.io-client'

export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; name: string; path: string; media_type: string }
  | { type: 'file'; name: string; path: string; media_type?: string }

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string | ContentBlock[]
}

export interface StartRunRequest {
  input: string | ContentBlock[]
  session_id?: string
  profile?: string
  model?: string
  provider?: string
  model_groups?: Array<{ provider: string; models: string[] }>
  source?: string
  [key: string]: unknown
}

export interface StartRunResponse { run_id: string; status: string }

export interface RunEvent {
  event: string
  delta?: string
  text?: string
  tool?: string
  name?: string
  output?: string | null
  usage?: { input_tokens: number; output_tokens: number; total_tokens: number }
  session_id?: string
  title?: string
  error?: string
  [key: string]: unknown
}

export interface ResumeSessionPayload {
  session_id: string
  messages: any[]
  messageTotal?: number
  isWorking: boolean
  [key: string]: unknown
}

export type ChatRunTransport = 'chat-run' | 'global-agent'

let socket: Socket | null = null
let sessionHandlersRegistered = false

function getSocket(): Socket {
  if (!socket) {
    const baseUrl = getBaseUrlValue() || ''
    socket = io(baseUrl || undefined, {
      transports: ['websocket', 'polling'],
      autoConnect: false,
    })
  }
  return socket
}

export function connectChatRun() {
  const s = getSocket()
  if (!s.connected) {
    s.connect()
  }
  return s
}

export function disconnectChatRun() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
  sessionHandlersRegistered = false
}

export function getChatRunSocket() { return socket }

export function registerSessionHandlers(handlers: {
  onMessageDelta?: (data: RunEvent) => void
  onRunStarted?: (data: RunEvent) => void
  onRunCompleted?: (data: RunEvent) => void
  onRunFailed?: (data: RunEvent) => void
  onToolStarted?: (data: RunEvent) => void
  onToolCompleted?: (data: RunEvent) => void
  onReasoningDelta?: (data: RunEvent) => void
  onSessionTitleUpdated?: (data: RunEvent) => void
  onUsageUpdated?: (data: RunEvent) => void
  onCompressionStarted?: (data: RunEvent) => void
  onCompressionCompleted?: (data: RunEvent) => void
  onAbortStarted?: (data: RunEvent) => void
  onAbortCompleted?: (data: RunEvent) => void
  onApprovalRequested?: (data: RunEvent) => void
  onClarifyRequested?: (data: RunEvent) => void
  onRunQueued?: (data: RunEvent) => void
  onSessionCommand?: (data: RunEvent) => void
}) {
  const s = getSocket()
  if (sessionHandlersRegistered) return
  sessionHandlersRegistered = true

  s.on('message.delta', (data: RunEvent) => handlers.onMessageDelta?.(data))
  s.on('run.started', (data: RunEvent) => handlers.onRunStarted?.(data))
  s.on('run.completed', (data: RunEvent) => handlers.onRunCompleted?.(data))
  s.on('run.failed', (data: RunEvent) => handlers.onRunFailed?.(data))
  s.on('tool.started', (data: RunEvent) => handlers.onToolStarted?.(data))
  s.on('tool.completed', (data: RunEvent) => handlers.onToolCompleted?.(data))
  s.on('reasoning.delta', (data: RunEvent) => handlers.onReasoningDelta?.(data))
  s.on('session.title.updated', (data: RunEvent) => handlers.onSessionTitleUpdated?.(data))
  s.on('usage.updated', (data: RunEvent) => handlers.onUsageUpdated?.(data))
  s.on('compression.started', (data: RunEvent) => handlers.onCompressionStarted?.(data))
  s.on('compression.completed', (data: RunEvent) => handlers.onCompressionCompleted?.(data))
  s.on('abort.started', (data: RunEvent) => handlers.onAbortStarted?.(data))
  s.on('abort.completed', (data: RunEvent) => handlers.onAbortCompleted?.(data))
  s.on('approval.requested', (data: RunEvent) => handlers.onApprovalRequested?.(data))
  s.on('clarify.requested', (data: RunEvent) => handlers.onClarifyRequested?.(data))
  s.on('run.queued', (data: RunEvent) => handlers.onRunQueued?.(data))
  s.on('session.command', (data: RunEvent) => handlers.onSessionCommand?.(data))
}

export function unregisterSessionHandlers() {
  if (!socket) return
  socket.off('message.delta')
  socket.off('run.started')
  socket.off('run.completed')
  socket.off('run.failed')
  socket.off('tool.started')
  socket.off('tool.completed')
  socket.off('reasoning.delta')
  socket.off('session.title.updated')
  socket.off('usage.updated')
  socket.off('compression.started')
  socket.off('compression.completed')
  socket.off('abort.started')
  socket.off('abort.completed')
  socket.off('approval.requested')
  socket.off('clarify.requested')
  socket.off('run.queued')
  socket.off('session.command')
  sessionHandlersRegistered = false
}

export function onPeerUserMessage() {}
export function onSessionCommand() {}
export function onSessionTitleUpdated() {}

export function startRunViaSocket(data: StartRunRequest): { abort: () => void } {
  const s = connectChatRun()
  s.emit('chat-run', data)
  return {
    abort: () => {
      s.emit('abort', { session_id: data.session_id })
    },
  }
}

export function respondToolApproval(sessionId: string, approvalId: string, choice: string) {
  if (!socket) return
  socket.emit('approval.respond', { session_id: sessionId, approval_id: approvalId, choice })
}

export function respondClarify(sessionId: string, clarifyId: string, response: string) {
  if (!socket) return
  socket.emit('clarify.respond', { session_id: sessionId, clarify_id: clarifyId, response })
}

export function resumeSession(
  sessionId: string,
  callback: (data: ResumeSessionPayload) => void,
  profile?: string,
  transport?: ChatRunTransport,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = connectChatRun()
    const timeout = setTimeout(() => {
      s.off('resume_response')
      reject(new Error('resume timeout'))
    }, 15000)

    s.once('resume_response', (data: ResumeSessionPayload) => {
      clearTimeout(timeout)
      callback(data)
      resolve()
    })

    s.emit('resume', { session_id: sessionId, profile }, (response: ResumeSessionPayload) => {
      clearTimeout(timeout)
      callback(response)
      resolve()
    })
  })
}
