export type ToolState = 'pending' | 'running' | 'completed' | 'error'

export interface TextPart {
  type: 'text'
  text: string
}

export interface ReasoningPart {
  type: 'reasoning'
  text: string
}

export interface ToolPart {
  type: 'tool'
  name: string
  args: Record<string, unknown>
  state: ToolState
  result?: string
  error?: string
  callId: string
  startedAt?: number
  completedAt?: number
}

export interface StepStartPart {
  type: 'step-start'
  step: number
  agentId?: string
}

export interface StepFinishPart {
  type: 'step-finish'
  step: number
  cost?: number
  tokens?: { input: number; output: number; reasoning: number }
}

export interface FilePart {
  type: 'file'
  path: string
  content?: string
  diff?: string
  operation?: 'read' | 'create' | 'update' | 'delete'
}

export interface AgentPart {
  type: 'agent'
  agentId: string
  description?: string
}

export type Part =
  | TextPart
  | ReasoningPart
  | ToolPart
  | StepStartPart
  | StepFinishPart
  | FilePart
  | AgentPart

export interface Message {
  id: string
  sessionID: string
  role: 'user' | 'assistant'
  parts: Part[]
  time: {
    created: number
    completed?: number
  }
  agentId?: string
  model?: { providerID: string; modelID: string }
  tokens?: { input: number; output: number; reasoning: number; cache: { read: number; write: number } }
  cost?: number
  error?: { type: string; message: string }
  parentID?: string
}
