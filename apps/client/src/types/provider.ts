export type ProviderSource = 'env' | 'config' | 'custom' | 'api'

export interface ModelConfig {
  id?: string
  name?: string
  attachment?: boolean
  reasoning?: boolean
  temperature?: boolean
  toolCall?: boolean
  cost?: { input: number; output: number; cacheRead: number; cacheWrite: number }
  limit?: { context: number; output: number }
  status?: 'alpha' | 'beta' | 'deprecated' | 'active'
}

export interface ProviderConfig {
  id: string
  name: string
  env?: string[]
  npm?: string
  models: Record<string, ModelConfig>
  options?: {
    apiKey?: string
    baseURL?: string
    timeout?: number | false
  }
}

export interface Model {
  id: string
  name: string
  providerID: string
  attachment?: boolean
  reasoning?: boolean
  temperature?: boolean
  toolCall?: boolean
  cost?: { input: number; output: number; cacheRead: number; cacheWrite: number }
  limit?: { context: number; output: number }
  status?: 'alpha' | 'beta' | 'deprecated' | 'active'
}

export interface Provider {
  id: string
  name: string
  source: ProviderSource
  env: string[]
  key?: string
  options: Record<string, unknown>
  models: Record<string, Model>
}
