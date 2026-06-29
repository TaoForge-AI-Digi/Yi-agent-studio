import { Hono } from 'hono'
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, unlinkSync, readdirSync, statSync, copyFileSync, rmSync } from 'fs'
import { resolve, relative } from 'path'

const files = new Hono()

const WORKSPACE_ROOT = resolve(import.meta.dirname, '../../workspace')
mkdirSync(WORKSPACE_ROOT, { recursive: true })

function safePath(input: string): string {
  const decoded = decodeURIComponent(input)
  const joined = resolve(WORKSPACE_ROOT, decoded)
  if (!joined.startsWith(WORKSPACE_ROOT)) throw new Error('Path traversal denied')
  return joined
}

files.get('/list', (c) => {
  const rawPath = c.req.query('path') || ''
  const absPath = safePath(rawPath)
  if (!existsSync(absPath) || !statSync(absPath).isDirectory()) {
    return c.json({ entries: [], path: rawPath, absolutePath: absPath })
  }
  const entries = readdirSync(absPath).map(name => {
    const full = resolve(absPath, name)
    const stat = statSync(full)
    return {
      name,
      path: relative(WORKSPACE_ROOT, full).replace(/\\/g, '/'),
      isDir: stat.isDirectory(),
      size: stat.size,
      modTime: stat.mtime.toISOString(),
    }
  }).sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  return c.json({ entries, path: rawPath, absolutePath: absPath })
})

files.get('/read', (c) => {
  const rawPath = c.req.query('path') || ''
  const absPath = safePath(rawPath)
  if (!existsSync(absPath)) return c.json({ error: 'File not found' }, 404)
  const content = readFileSync(absPath, 'utf-8')
  return c.json({ content, path: rawPath, size: statSync(absPath).size })
})

files.put('/write', async (c) => {
  const body = await c.req.json()
  const absPath = safePath(body.path)
  mkdirSync(resolve(absPath, '..'), { recursive: true })
  writeFileSync(absPath, body.content || '', 'utf-8')
  return c.json({ ok: true })
})

files.delete('/delete', async (c) => {
  const body = await c.req.json()
  const absPath = safePath(body.path)
  if (!existsSync(absPath)) return c.json({ error: 'Not found' }, 404)
  const stat = statSync(absPath)
  if (stat.isDirectory()) {
    rmSync(absPath, { recursive: true, force: true })
  } else {
    unlinkSync(absPath)
  }
  return c.json({ ok: true })
})

files.post('/rename', async (c) => {
  const body = await c.req.json()
  const oldPath = safePath(body.oldPath)
  const newPath = safePath(body.newPath)
  if (!existsSync(oldPath)) return c.json({ error: 'Not found' }, 404)
  mkdirSync(resolve(newPath, '..'), { recursive: true })
  renameSync(oldPath, newPath)
  return c.json({ ok: true })
})

files.post('/mkdir', async (c) => {
  const body = await c.req.json()
  const absPath = safePath(body.path)
  mkdirSync(absPath, { recursive: true })
  return c.json({ ok: true })
})

files.post('/copy', async (c) => {
  const body = await c.req.json()
  const srcPath = safePath(body.srcPath)
  const destPath = safePath(body.destPath)
  if (!existsSync(srcPath)) return c.json({ error: 'Source not found' }, 404)
  mkdirSync(resolve(destPath, '..'), { recursive: true })
  copyFileSync(srcPath, destPath)
  return c.json({ ok: true })
})

files.post('/upload', async (c) => {
  const body = await c.req.parseBody()
  const rawPath = (c.req.query('path') || '') as string
  const absDir = safePath(rawPath)
  mkdirSync(absDir, { recursive: true })

  const uploaded: { name: string; path: string }[] = []
  const fileEntries = body['file']
  const filesArr = Array.isArray(fileEntries) ? fileEntries : (fileEntries ? [fileEntries] : [])

  for (const file of filesArr) {
    if (file instanceof File) {
      const fileName = file.name
      const destPath = resolve(absDir, fileName)
      const buffer = await file.arrayBuffer()
      writeFileSync(destPath, Buffer.from(buffer))
      uploaded.push({
        name: fileName,
        path: relative(WORKSPACE_ROOT, destPath).replace(/\\/g, '/'),
      })
    }
  }

  return c.json({ files: uploaded })
})

export default files
