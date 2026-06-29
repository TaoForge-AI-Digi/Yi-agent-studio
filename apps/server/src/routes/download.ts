import { Hono } from 'hono'
import { readFileSync, existsSync, statSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const download = new Hono()

const WORKSPACE_ROOT = resolve(import.meta.dirname, '../../workspace')
mkdirSync(WORKSPACE_ROOT, { recursive: true })

function safePath(input: string): string {
  const decoded = decodeURIComponent(input)
  const joined = resolve(WORKSPACE_ROOT, decoded)
  if (!joined.startsWith(WORKSPACE_ROOT)) throw new Error('Path traversal denied')
  return joined
}

download.get('/', (c) => {
  const rawPath = c.req.query('path') || ''
  const fileName = c.req.query('name') || rawPath.split('/').pop() || 'download'
  const absPath = safePath(rawPath)

  if (!existsSync(absPath)) return c.json({ error: 'File not found' }, 404)

  const stat = statSync(absPath)
  const content = readFileSync(absPath)
  const ext = fileName.split('.').pop()?.toLowerCase()
  const mime: Record<string, string> = {
    txt: 'text/plain', md: 'text/markdown', json: 'application/json',
    js: 'text/javascript', ts: 'text/typescript', py: 'text/x-python',
    html: 'text/html', css: 'text/css', vue: 'text/plain',
    yaml: 'text/yaml', yml: 'text/yaml', toml: 'text/toml',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp',
    pdf: 'application/pdf', zip: 'application/zip',
  }

  c.header('Content-Type', ext && mime[ext] ? mime[ext] : 'application/octet-stream')
  c.header('Content-Disposition', `attachment; filename="${fileName}"`)
  c.header('Content-Length', String(stat.size))
  return c.body(content)
})

export default download
