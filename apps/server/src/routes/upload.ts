import { Hono } from 'hono'
import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const uploadRoute = new Hono()

const UPLOAD_DIR = resolve(import.meta.dirname, '../../uploads')
mkdirSync(UPLOAD_DIR, { recursive: true })

uploadRoute.post('/', async (c) => {
  const body = await c.req.parseBody()
  const uploaded: { name: string; path: string }[] = []
  const fileEntries = body['file']
  const filesArr = Array.isArray(fileEntries) ? fileEntries : (fileEntries ? [fileEntries] : [])

  for (const file of filesArr) {
    if (file instanceof File) {
      const fileName = file.name
      const destPath = resolve(UPLOAD_DIR, fileName)
      const buffer = await file.arrayBuffer()
      writeFileSync(destPath, Buffer.from(buffer))
      uploaded.push({ name: fileName, path: destPath })
    }
  }

  return c.json({ files: uploaded })
})

export default uploadRoute
