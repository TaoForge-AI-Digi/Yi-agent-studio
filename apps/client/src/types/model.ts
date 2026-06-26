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

export const BUILTIN_PROVIDERS: YiProviderConfig[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    enabled: true,
    builtin: true,
    models: [],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    enabled: true,
    builtin: true,
    models: [],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    apiKey: '',
    enabled: true,
    builtin: true,
    models: [],
  },
  {
    id: 'opencode-zen',
    name: 'OpenCode Zen',
    baseUrl: 'https://opencode.ai/zen/v1/',
    apiKey: '',
    enabled: true,
    builtin: true,
    models: [],
  },
  {
    id: 'opencode-go',
    name: 'OpenCode Go',
    baseUrl: 'https://opencode.ai/zen/go/v1/',
    apiKey: '',
    enabled: true,
    builtin: true,
    models: [],
  },
]
