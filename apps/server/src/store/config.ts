import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const DATA_DIR = resolve(import.meta.dirname, '../../data')
const CONFIG_FILE = resolve(DATA_DIR, 'config.json')

mkdirSync(DATA_DIR, { recursive: true })

interface AppConfig {
  display?: Record<string, unknown>
  agent?: Record<string, unknown>
  memory?: Record<string, unknown>
  skills?: Record<string, unknown>
  compression?: Record<string, unknown>
  [key: string]: unknown
}

const defaults: AppConfig = {
  display: {
    compact: false,
    show_reasoning: true,
    streaming: true,
    inline_diffs: false,
    show_cost: false,
  },
  agent: {
    max_turns: 20,
  },
  compression: {
    enabled: true,
    threshold: 8000,
    target_ratio: 0.5,
    protect_last_n: 10,
  },
}

function readAll(): AppConfig {
  if (!existsSync(CONFIG_FILE)) return { ...defaults }
  try {
    return { ...defaults, ...JSON.parse(readFileSync(CONFIG_FILE, 'utf-8')) }
  } catch {
    return { ...defaults }
  }
}

function writeAll(config: AppConfig) {
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
}

export const configStore = {
  getAll(): AppConfig {
    return readAll()
  },

  getSection(section: string): unknown {
    const config = readAll()
    return config[section] || null
  },

  updateSection(section: string, values: Record<string, unknown>): AppConfig {
    const config = readAll()
    config[section] = { ...(config[section] as Record<string, unknown> || {}), ...values }
    writeAll(config)
    return config
  },
}
