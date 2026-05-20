// recents.ts — Persisted recent folders/lists store for the CLI.
// Stores the last 10 opened folders & lists in a JSON file alongside the auth token.
import Conf from 'conf'

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
  items: RecentEntry[]
}

const store = new Conf<RecentsData>({
  projectName: 'stratanodex-cli',
  defaults: { items: [] },
})

/** Record a folder/list being opened. Pushes to front and deduplicates. */
export function recordRecent(entry: Omit<RecentEntry, 'openedAt'>): void {
  const key = `${entry.type}:${entry.id}`
  const existing = store.get('items', [])
  const filtered = existing.filter((e) => `${e.type}:${e.id}` !== key)
  const next: RecentEntry[] = [{ ...entry, openedAt: Date.now() }, ...filtered].slice(
    0,
    MAX_RECENTS
  )
  store.set('items', next)
}

/** Get the list of recent entries, most recent first. */
export function getRecents(): RecentEntry[] {
  return store.get('items', [])
}

/** Clear all recents. */
export function clearRecents(): void {
  store.set('items', [])
}
