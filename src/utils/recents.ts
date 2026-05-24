// recents.ts — Persisted recent folders/lists store for the CLI.
// Stores the last 10 opened folders & lists per user (keyed by userId decoded from JWT).
import Conf from 'conf'
import { getToken } from './auth.js'

const MAX_RECENTS = 10

export interface RecentEntry {
  id: string
  name: string
  type: 'folder' | 'list'
  folderId?: string
  folderName?: string
  openedAt: number
}

interface RecentsData {
  [userKey: string]: RecentEntry[]
}

const store = new Conf<RecentsData>({
  projectName: 'stratanodex-cli',
  defaults: {},
})

/** Decode the userId from the stored JWT without verifying the signature. */
function getCurrentUserId(): string | null {
  const token = getToken()
  if (!token) return null
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1]!, 'base64').toString('utf8'))
    return (payload.userId ?? payload.sub ?? payload.id ?? null) as string | null
  } catch {
    return null
  }
}

function storeKey(): string {
  const userId = getCurrentUserId()
  return userId ? `items_${userId}` : 'items_guest'
}

/** Record a folder/list being opened. Pushes to front and deduplicates. */
export function recordRecent(entry: Omit<RecentEntry, 'openedAt'>): void {
  const key = storeKey()
  const dedupKey = `${entry.type}:${entry.id}`
  const existing = (store.get(key) as RecentEntry[] | undefined) ?? []
  const filtered = existing.filter((e) => `${e.type}:${e.id}` !== dedupKey)
  const next: RecentEntry[] = [{ ...entry, openedAt: Date.now() }, ...filtered].slice(
    0,
    MAX_RECENTS
  )
  store.set(key, next)
}

/** Get the list of recent entries for the current user, most recent first. */
export function getRecents(): RecentEntry[] {
  const key = storeKey()
  return (store.get(key) as RecentEntry[] | undefined) ?? []
}

/** Clear recents for the current user only. */
export function clearRecents(): void {
  const key = storeKey()
  store.delete(key)
}
