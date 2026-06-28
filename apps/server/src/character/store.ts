import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs'
import { resolve } from 'path'

const CHAR_DIR = resolve(import.meta.dirname, '../../data/characters')

function agentDir(agentId: string) {
  return resolve(CHAR_DIR, agentId)
}

function readSection(agentId: string, section: string): string {
  const file = resolve(agentDir(agentId), `${section}.md`)
  if (!existsSync(file)) return ''
  return readFileSync(file, 'utf-8')
}

function writeSection(agentId: string, section: string, content: string) {
  const dir = agentDir(agentId)
  mkdirSync(dir, { recursive: true })
  writeFileSync(resolve(dir, `${section}.md`), content, 'utf-8')
}

function mtime(agentId: string, section: string): number {
  const file = resolve(agentDir(agentId), `${section}.md`)
  if (!existsSync(file)) return 0
  return statSync(file).mtimeMs
}

export const characterStore = {
  get(agentId: string) {
    return {
      soul: readSection(agentId, 'soul'),
      memory: readSection(agentId, 'memory'),
      user: readSection(agentId, 'user'),
      soul_mtime: mtime(agentId, 'soul'),
      memory_mtime: mtime(agentId, 'memory'),
      user_mtime: mtime(agentId, 'user'),
    }
  },

  update(agentId: string, section: string, content: string) {
    if (!['soul', 'memory', 'user'].includes(section)) return false
    writeSection(agentId, section, content)
    return true
  },
}
