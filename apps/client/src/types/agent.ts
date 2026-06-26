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

export const BUILTIN_AGENTS: Agent[] = [
  {
    id: 'general',
    name: 'General',
    description: 'General-purpose assistant for everyday tasks',
    avatar: '',
    color: '#6366f1',
    soul: 'You are a helpful, harmless, and honest assistant.',
    mode: 'all',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'coder',
    name: 'Coder',
    description: 'Expert programmer for writing, debugging, and refactoring code',
    avatar: '',
    color: '#10b981',
    soul: 'You are an expert programmer. Write clean, well-tested code. Follow language idioms and best practices.',
    permissions: { edit: 'allow', bash: 'ask', webfetch: 'allow' },
    mode: 'all',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    description: 'Code reviewer focused on security, performance, and best practices',
    avatar: '',
    color: '#f59e0b',
    soul: 'You are a senior code reviewer. Focus on security vulnerabilities, performance issues, and adherence to best practices.',
    permissions: { edit: 'deny', bash: 'deny', webfetch: 'allow' },
    mode: 'all',
    enabled: true,
    builtIn: true,
  },
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Read-only codebase explorer for understanding architecture',
    avatar: '',
    color: '#8b5cf6',
    soul: 'You are a codebase explorer. Help users understand code architecture without modifying anything.',
    permissions: { edit: 'deny', bash: 'deny', webfetch: 'allow' },
    tools: { read: true, grep: true, glob: true, edit: false, write: false, bash: false },
    mode: 'all',
    enabled: true,
    builtIn: true,
  },
]
