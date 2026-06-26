import type { Message } from './message'

export type SessionStatusType = 'idle' | 'busy' | 'retry'

export interface SessionStatus {
  type: SessionStatusType
  attempt?: number
  message?: string
  next?: number
}

export interface SessionSummary {
  title?: string
  body?: string
  additions?: number
  deletions?: number
  files?: string[]
}

export interface SessionFork {
  parentID: string
  forkPointMessageID: string
  parentTitle?: string
}

export interface Session {
  id: string
  title: string
  agentId: string
  parentID?: string
  forkPointMessageID?: string
  version: number
  summary?: SessionSummary
  messages: Message[]
  status: SessionStatus
  time: { created: number; updated: number }
  model?: string
  provider?: string
  queueLength: number
  queuedMessages: Message[]
  revert?: { messageID: string; snapshot?: string }
  inputTokens?: number
  outputTokens?: number
  contextTokens?: number
}

export interface SessionCreateOptions {
  agentId?: string
  model?: string
  provider?: string
  parentID?: string
  forkPointMessageID?: string
}
