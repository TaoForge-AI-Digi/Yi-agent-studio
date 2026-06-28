import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const DATA_DIR = resolve(import.meta.dirname, '../../data')
const CHARACTERS_FILE = resolve(DATA_DIR, 'characters.json')
const CHAR_DIR = resolve(DATA_DIR, 'characters')

mkdirSync(DATA_DIR, { recursive: true })
mkdirSync(CHAR_DIR, { recursive: true })

interface CharacterRecord {
  id: string
  name: string
  description?: string
  avatar?: string
  color?: string
  soul?: string
  model?: string
  provider?: string
  tools?: Record<string, boolean>
  permissions?: { edit?: string; bash?: string; webfetch?: string }
  maxSteps?: number
  mode?: string
  enabled?: boolean
  builtIn?: boolean
  createdAt?: number
  updatedAt?: number
}

function readAll(): CharacterRecord[] {
  if (!existsSync(CHARACTERS_FILE)) return []
  try {
    return JSON.parse(readFileSync(CHARACTERS_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writeAll(items: CharacterRecord[]) {
  writeFileSync(CHARACTERS_FILE, JSON.stringify(items, null, 2), 'utf-8')
}

export const characterMetaStore = {
  getAll(): CharacterRecord[] {
    return readAll()
  },

  getById(id: string): CharacterRecord | null {
    return readAll().find(a => a.id === id) || null
  },

  create(data: CharacterRecord): CharacterRecord {
    const all = readAll()
    all.push(data)
    writeAll(all)
    return data
  },

  update(id: string, patch: Partial<CharacterRecord>): CharacterRecord | null {
    const all = readAll()
    const idx = all.findIndex(a => a.id === id)
    if (idx < 0) return null
    all[idx] = { ...all[idx], ...patch, id, updatedAt: Date.now() }
    writeAll(all)
    return all[idx]
  },

  delete(id: string): boolean {
    const all = readAll()
    const filtered = all.filter(a => a.id !== id)
    if (filtered.length === all.length) return false
    writeAll(filtered)
    return true
  },
}

const BUILTIN_SEED: CharacterRecord[] = [
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

export function seedBuiltinAgents() {
  const all = readAll()
  const existingIds = new Set(all.map(a => a.id))
  const now = Date.now()
  let changed = false

  for (const agent of BUILTIN_SEED) {
    if (!existingIds.has(agent.id)) {
      all.push({ ...agent, createdAt: now, updatedAt: now })
      changed = true
    }
    // Ensure soul.md exists on disk
    const soulFile = resolve(CHAR_DIR, agent.id, 'soul.md')
    if (!existsSync(soulFile) && agent.soul) {
      mkdirSync(resolve(CHAR_DIR, agent.id), { recursive: true })
      writeFileSync(soulFile, agent.soul, 'utf-8')
    }
  }

  if (changed) writeAll(all)
}
