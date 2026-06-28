export interface YiProviderConfig {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  models: YiModelConfig[]
  enabled: boolean
  builtin?: boolean
}

export interface YiModelConfig {
  id: string
  name: string
  visible: boolean
}
