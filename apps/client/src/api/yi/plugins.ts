import { request } from '../client'

export type PluginConfigStatus = 'enabled' | 'disabled' | 'not-enabled' | 'auto' | 'provider-managed'
export type PluginEffectiveStatus = 'enabled' | 'disabled' | 'inactive' | 'auto-active' | 'provider-managed'

export interface YiPluginInfo {
  key: string
  name: string
  kind: string
  source: string
  configStatus: PluginConfigStatus | string
  effectiveStatus: PluginEffectiveStatus | string
  version: string
  description: string
  author: string
  path: string
  providesTools: string[]
  providesHooks: string[]
  requiresEnv: Array<string | Record<string, unknown>>
}

export interface YiPluginsMetadata {
  hermesAgentRoot: string
  pythonExecutable: string
  cwd: string
  projectPluginsEnabled: boolean
}

export interface YiPluginsResponse {
  plugins: YiPluginInfo[]
  warnings: string[]
  metadata: YiPluginsMetadata
}

export async function fetchPlugins(): Promise<YiPluginsResponse> {
  return request<YiPluginsResponse>('/api/yi/plugins')
}
