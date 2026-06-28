export interface AgentPermission {
  edit?: 'ask' | 'allow' | 'deny'
  bash?: 'ask' | 'allow' | 'deny'
  webfetch?: 'ask' | 'allow' | 'deny'
}

export interface AgentMemory {
  enabled: boolean
  maxEntries?: number
}

export interface Agent {
  id: string
  name: string
  description?: string
  avatar?: string
  color?: string
  soul?: string
  userProfile?: string
  memory?: AgentMemory
  memoryContent?: string
  model?: string
  provider?: string
  tools?: Record<string, boolean>
  permissions?: AgentPermission
  maxSteps?: number
  mode?: 'primary' | 'subagent' | 'all'
  enabled?: boolean
  builtIn?: boolean
  createdAt?: number
  updatedAt?: number
}

export type AgentConfig = Omit<Agent, 'id' | 'builtIn' | 'createdAt' | 'updatedAt'>
