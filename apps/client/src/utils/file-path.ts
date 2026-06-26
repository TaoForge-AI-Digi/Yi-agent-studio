import type { FileEntry } from '@/api/yi/files'

export function getClipboardPathForEntry(entry: FileEntry): string {
  return entry.absolutePath || entry.path
}
