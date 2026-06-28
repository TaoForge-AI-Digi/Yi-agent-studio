// Stub: chat backend not yet implemented
// Types kept for frontend compilation, all functions are no-ops

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

export function registerSessionHandlers() {}
export function unregisterSessionHandlers() {}
export function onPeerUserMessage() {}
export function onSessionCommand() {}
export function onSessionTitleUpdated() {}
export function respondClarify() {}
export function respondToolApproval() {}
export function getChatRunSocket() { return null as any }
export function connectChatRun() { return null as any }
export function disconnectChatRun() {}
export function resumeSession() { return null as any }
export function startRunViaSocket() { return { abort: () => {} } }
