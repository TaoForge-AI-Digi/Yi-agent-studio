import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const DATA_DIR = resolve(import.meta.dirname, '../../data')
const PROVIDERS_FILE = resolve(DATA_DIR, 'providers.json')

mkdirSync(DATA_DIR, { recursive: true })

interface ModelConfig {
  id: string
  name: string
  visible: boolean
}

interface ProviderRecord {
  id: string
  name: string
  baseUrl: string
  apiKey: string
  models: ModelConfig[]
  enabled: boolean
  builtin?: boolean
  createdAt?: number
  updatedAt?: number
}

function readAll(): ProviderRecord[] {
  if (!existsSync(PROVIDERS_FILE)) return []
  try {
    return JSON.parse(readFileSync(PROVIDERS_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writeAll(items: ProviderRecord[]) {
  writeFileSync(PROVIDERS_FILE, JSON.stringify(items, null, 2), 'utf-8')
}

export const modelStore = {
  getAll(): ProviderRecord[] {
    return readAll()
  },

  getById(id: string): ProviderRecord | null {
    return readAll().find(p => p.id === id) || null
  },

  create(data: ProviderRecord): ProviderRecord {
    const all = readAll()
    all.push(data)
    writeAll(all)
    return data
  },

  update(id: string, patch: Partial<ProviderRecord>): ProviderRecord | null {
    const all = readAll()
    const idx = all.findIndex(p => p.id === id)
    if (idx < 0) return null
    all[idx] = { ...all[idx], ...patch, id, updatedAt: Date.now() }
    writeAll(all)
    return all[idx]
  },

  delete(id: string): boolean {
    const all = readAll()
    const filtered = all.filter(p => p.id !== id)
    if (filtered.length === all.length) return false
    writeAll(filtered)
    return true
  },
}

const BUILTIN_SEED: ProviderRecord[] = [
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

export function seedBuiltinProviders() {
  const all = readAll()
  const existingIds = new Set(all.map(p => p.id))
  const now = Date.now()
  let changed = false

  for (const provider of BUILTIN_SEED) {
    if (!existingIds.has(provider.id)) {
      all.push({ ...provider, createdAt: now, updatedAt: now })
      changed = true
    }
  }

  if (changed) writeAll(all)
}
