import type { Message as PartMessage, Part, TextPart, ReasoningPart, ToolPart } from '@/types/message'

export interface FlatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool' | 'command'
  content: string
  reasoning?: string
  toolName?: string
  toolCallId?: string
  toolArgs?: unknown
  toolResult?: unknown
  toolStatus?: 'running' | 'done' | 'error'
  toolDuration?: number
  isStreaming?: boolean
  timestamp: number
  finishReason?: string | null
}

export function toPartMessage(flat: FlatMessage, sessionID: string): PartMessage {
  const parts: Part[] = []

  if (flat.content) {
    parts.push({ type: 'text', text: flat.content })
  }

  if (flat.reasoning) {
    parts.push({ type: 'reasoning', text: flat.reasoning })
  }

  if (flat.toolName) {
    const stateMap: Record<string, ToolPart['state']> = {
      running: 'running',
      done: 'completed',
      error: 'error',
    }
    parts.push({
      type: 'tool',
      name: flat.toolName,
      args: (typeof flat.toolArgs === 'object' && flat.toolArgs !== null ? flat.toolArgs : {}) as Record<string, unknown>,
      state: stateMap[flat.toolStatus || 'running'] || 'pending',
      result: flat.toolResult ? String(flat.toolResult) : undefined,
      callId: flat.toolCallId || '',
    })
  }

  return {
    id: flat.id,
    sessionID,
    role: flat.role === 'system' || flat.role === 'tool' || flat.role === 'command' ? 'assistant' : flat.role,
    parts,
    time: { created: flat.timestamp },
  }
}

export function toFlatMessage(partMsg: PartMessage): FlatMessage {
  const textPart = partMsg.parts.find((p): p is TextPart => p.type === 'text')
  const reasoningPart = partMsg.parts.find((p): p is ReasoningPart => p.type === 'reasoning')
  const toolPart = partMsg.parts.find((p): p is ToolPart => p.type === 'tool')

  const statusMap: Record<ToolPart['state'], FlatMessage['toolStatus']> = {
    pending: 'running',
    running: 'running',
    completed: 'done',
    error: 'error',
  }

  return {
    id: partMsg.id,
    role: partMsg.role,
    content: textPart?.text || '',
    reasoning: reasoningPart?.text,
    toolName: toolPart?.name,
    toolCallId: toolPart?.callId,
    toolArgs: toolPart?.args,
    toolResult: toolPart?.result,
    toolStatus: toolPart ? statusMap[toolPart.state] : undefined,
    toolDuration: toolPart?.startedAt && toolPart?.completedAt
      ? (toolPart.completedAt - toolPart.startedAt) / 1000
      : undefined,
    timestamp: partMsg.time.created,
    finishReason: undefined,
  }
}

export function extractText(parts: Part[]): string {
  return parts
    .filter((p): p is TextPart => p.type === 'text')
    .map(p => p.text)
    .join('')
}

export function extractReasoning(parts: Part[]): string {
  return parts
    .filter((p): p is ReasoningPart => p.type === 'reasoning')
    .map(p => p.text)
    .join('')
}

export function extractTools(parts: Part[]): ToolPart[] {
  return parts.filter((p): p is ToolPart => p.type === 'tool')
}
