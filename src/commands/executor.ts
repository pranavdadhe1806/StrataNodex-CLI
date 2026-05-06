// executor.ts — Takes a fully-formed command string, parses it, and calls the API.

import {
  createFolder,
  updateFolder,
  deleteFolder,
  createList,
  updateList,
  deleteList,
  createRootNode,
  createChildNode,
  updateNode,
  deleteNode,
  moveNode,
  attachTag,
  detachTag,
  getMe,
  getStreak,
  getTags,
  getFolders,
  getLists,
  getNodes,
} from '../api/client.js'
import { flattenTree, assignNumbers } from '../utils/numbering.js'
import { clearToken } from '../utils/auth.js'
import type { Screen } from './registry.js'

export interface ExecuteContext {
  /** For node commands — current list ID. */
  listId?: string
  /** For list commands — current folder ID. */
  folderId?: string
  /** Current nodes (pre-fetched by the screen hook). */
  currentNodes?: Awaited<ReturnType<typeof getNodes>>
  /** ID of the currently selected (cursor) node — used by /add sub-node. */
  selectedNodeId?: string
  /** Navigation function. */
  navigate?: (screen: string, params?: Record<string, string>) => void
  /** Exit the TUI. */
  exit?: () => void
  /** Callback to refetch data in the current screen. */
  refetch?: () => void
}

export interface ExecuteResult {
  ok: boolean
  message: string
}

/** Resolve index-or-title to a node ID from the flat node list.
 *  Index can be hierarchical: "1", "1.2", "1.2.1" etc. */
function resolveNode(
  ref: string,
  nodes: Awaited<ReturnType<typeof getNodes>>
): (typeof nodes)[number] | undefined {
  const flat = flattenTree(nodes)
  const numberMap = assignNumbers(nodes)

  // Try matching by hierarchical number (e.g. "1", "1.2", "1.2.1")
  for (const node of flat) {
    if (numberMap.get(node.id) === ref) return node
  }

  // Fall back to title match
  return flat.find((n) => n.title.toLowerCase() === ref.toLowerCase())
}

/** Parse a DD-MM-YYYY date string into ISO format. */
function parseDate(raw: string): string | null {
  const [dd, mm, yyyy] = raw.split('-')
  if (!dd || !mm || !yyyy) return null
  const iso = `${yyyy}-${mm}-${dd}`
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

/** Parse HH:MM AM/PM into an ISO-compatible time offset (applied to today). */
function parseTime(raw: string, baseIso?: string): string | null {
  // e.g. "10:30 AM" or "2:15 PM"
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return null
  let hours = parseInt(match[1]!, 10)
  const minutes = parseInt(match[2]!, 10)
  const meridiem = match[3]!.toUpperCase()
  if (meridiem === 'PM' && hours !== 12) hours += 12
  if (meridiem === 'AM' && hours === 12) hours = 0
  const base = baseIso ? new Date(baseIso) : new Date()
  base.setHours(hours, minutes, 0, 0)
  return base.toISOString()
}

export async function executeCommand(
  input: string,
  _screen: Screen,
  ctx: ExecuteContext
): Promise<ExecuteResult> {
  const trimmed = input.trim()
  if (!trimmed.startsWith('/')) return { ok: false, message: 'Commands must start with /' }

  // ─── GLOBAL commands ────────────────────────────────────────────────────
  if (trimmed === '/back') {
    ctx.navigate?.('__pop__')
    return { ok: true, message: '' }
  }
  if (trimmed === '/home' || trimmed === '/folders') {
    ctx.navigate?.('home')
    return { ok: true, message: '' }
  }
  if (trimmed === '/dashboard') {
    ctx.navigate?.('dashboard')
    return { ok: true, message: '' }
  }
  if (trimmed === '/logout') {
    clearToken()
    ctx.navigate?.('login')
    return { ok: true, message: 'Logged out.' }
  }
  if (trimmed === '/help') {
    ctx.navigate?.('help')
    return { ok: true, message: '' }
  }
  if (trimmed === '/whoami') {
    try {
      const [user, streakData] = await Promise.all([getMe(), getStreak()])
      return { ok: true, message: `${user.name ?? user.email} · Streak: ${streakData.streak} days` }
    } catch (e: unknown) {
      return { ok: false, message: (e as Error).message }
    }
  }
  if (trimmed === '/tags') {
    ctx.navigate?.('tags')
    return { ok: true, message: '' }
  }

  // ─── FOLDERS commands ───────────────────────────────────────────────────
  if (trimmed.startsWith('/new folder ')) {
    const name = trimmed.slice('/new folder '.length).trim()
    if (!name) return { ok: false, message: 'Folder name required.' }
    try {
      const f = await createFolder(name)
      ctx.refetch?.()
      return { ok: true, message: `✓ Created folder "${f.name}"` }
    } catch (e: unknown) {
      return { ok: false, message: (e as Error).message }
    }
  }
  if (trimmed.startsWith('/delete folder ')) {
    const name = trimmed.slice('/delete folder '.length).trim()
    try {
      const folders = await getFolders()
      const target = folders.find((f) => f.name.toLowerCase() === name.toLowerCase())
      if (!target) return { ok: false, message: `Folder "${name}" not found.` }
      await deleteFolder(target.id)
      ctx.refetch?.()
      return { ok: true, message: `✓ Deleted folder "${name}"` }
    } catch (e: unknown) {
      return { ok: false, message: (e as Error).message }
    }
  }
  if (trimmed.startsWith('/edit folder ')) {
    const rest = trimmed.slice('/edit folder '.length).trim()
    const spaceIdx = rest.indexOf(' ')
    if (spaceIdx === -1) return { ok: false, message: 'Usage: /edit folder <name> <new-name>' }
    const oldName = rest.slice(0, spaceIdx).trim()
    const newName = rest.slice(spaceIdx + 1).trim()
    try {
      const folders = await getFolders()
      const target = folders.find((f) => f.name.toLowerCase() === oldName.toLowerCase())
      if (!target) return { ok: false, message: `Folder "${oldName}" not found.` }
      await updateFolder(target.id, { name: newName })
      ctx.refetch?.()
      return { ok: true, message: `✓ Renamed folder to "${newName}"` }
    } catch (e: unknown) {
      return { ok: false, message: (e as Error).message }
    }
  }

  // ─── LISTS commands ──────────────────────────────────────────────────────
  if (trimmed.startsWith('/new list ')) {
    const name = trimmed.slice('/new list '.length).trim()
    if (!name) return { ok: false, message: 'List name required.' }
    if (!ctx.folderId) return { ok: false, message: 'Not inside a folder.' }
    try {
      const l = await createList(name, ctx.folderId)
      ctx.refetch?.()
      return { ok: true, message: `✓ Created list "${l.name}"` }
    } catch (e: unknown) {
      return { ok: false, message: (e as Error).message }
    }
  }
  if (trimmed.startsWith('/delete list ')) {
    const name = trimmed.slice('/delete list '.length).trim()
    if (!ctx.folderId) return { ok: false, message: 'Not inside a folder.' }
    try {
      const lists = await getLists(ctx.folderId)
      const target = lists.find((l) => l.name.toLowerCase() === name.toLowerCase())
      if (!target) return { ok: false, message: `List "${name}" not found.` }
      await deleteList(target.id)
      ctx.refetch?.()
      return { ok: true, message: `✓ Deleted list "${name}"` }
    } catch (e: unknown) {
      return { ok: false, message: (e as Error).message }
    }
  }
  if (trimmed.startsWith('/edit list ')) {
    const rest = trimmed.slice('/edit list '.length).trim()
    const spaceIdx = rest.indexOf(' ')
    if (spaceIdx === -1) return { ok: false, message: 'Usage: /edit list <name> <new-name>' }
    const oldName = rest.slice(0, spaceIdx).trim()
    const newName = rest.slice(spaceIdx + 1).trim()
    if (!ctx.folderId) return { ok: false, message: 'Not inside a folder.' }
    try {
      const lists = await getLists(ctx.folderId)
      const target = lists.find((l) => l.name.toLowerCase() === oldName.toLowerCase())
      if (!target) return { ok: false, message: `List "${oldName}" not found.` }
      await updateList(target.id, { name: newName })
      ctx.refetch?.()
      return { ok: true, message: `✓ Renamed list to "${newName}"` }
    } catch (e: unknown) {
      return { ok: false, message: (e as Error).message }
    }
  }

  // ─── NODES commands ──────────────────────────────────────────────────────
  const nodes = ctx.currentNodes ?? []
  const listId = ctx.listId

  if (trimmed.startsWith('/add node ') && !trimmed.includes(' ... ')) {
    const title = trimmed.slice('/add node '.length).trim()
    if (!title) return { ok: false, message: 'Node title required.' }
    if (!listId) return { ok: false, message: 'Not inside a list.' }
    try {
      const n = await createRootNode(listId, { title })
      ctx.refetch?.()
      return { ok: true, message: `✓ Added "${n.title}"` }
    } catch (e: unknown) {
      return { ok: false, message: (e as Error).message }
    }
  }

  if (trimmed.startsWith('/add sub-node ')) {
    const rest = trimmed.slice('/add sub-node '.length).trim()
    if (!rest) return { ok: false, message: 'Sub-node title required.' }
    if (!listId) return { ok: false, message: 'Not inside a list.' }

    // Check if first word is a numeric index like "1", "1.2", "1.2.1"
    const parts = rest.split(/\s+/)
    const indexPattern = /^\d+(\.\d+)*$/
    let parentId: string | undefined
    let title: string

    if (indexPattern.test(parts[0]!)) {
      // /add sub-node <index> <title>
      const idx = parts[0]!
      title = parts.slice(1).join(' ')
      if (!title) return { ok: false, message: 'Sub-node title required after index.' }
      const flat = flattenTree(nodes)
      const numberMap = new Map<string, string>()
      function buildNumbers(children: typeof nodes, prefix: string): void {
        const sorted = [...children].sort((a, b) => a.position - b.position)
        sorted.forEach((node, i) => {
          const num = prefix ? `${prefix}.${i + 1}` : `${i + 1}`
          numberMap.set(num, node.id)
          if ((node.children ?? []).length > 0) buildNumbers(node.children, num)
        })
      }
      buildNumbers(nodes, '')
      parentId = numberMap.get(idx)
      if (!parentId) return { ok: false, message: `Node "${idx}" not found.` }
    } else {
      // /add sub-node <title> — use currently selected node
      title = rest
      parentId = ctx.selectedNodeId
      if (!parentId)
        return {
          ok: false,
          message: 'No node selected. Navigate to a node first, or specify an index.',
        }
    }

    try {
      const n = await createChildNode(parentId, { title })
      ctx.refetch?.()
      return { ok: true, message: `✓ Added sub-node "${n.title}"` }
    } catch (e: unknown) {
      return { ok: false, message: (e as Error).message }
    }
  }

  if (trimmed.startsWith('/done ')) {
    const ref = trimmed.slice('/done '.length).trim()
    const node = resolveNode(ref, nodes)
    if (!node) return { ok: false, message: `Node "${ref}" not found.` }
    try {
      await updateNode(node.id, { status: 'DONE' })
      ctx.refetch?.()
      return { ok: true, message: `✓ Done: "${node.title}"` }
    } catch (e: unknown) {
      return { ok: false, message: (e as Error).message }
    }
  }

  if (trimmed.startsWith('/delete node ') && !trimmed.includes(' ... ')) {
    const ref = trimmed.slice('/delete node '.length).trim()
    const node = resolveNode(ref, nodes)
    if (!node) return { ok: false, message: `Node "${ref}" not found.` }
    try {
      await deleteNode(node.id)
      ctx.refetch?.()
      return { ok: true, message: `✓ Deleted "${node.title}"` }
    } catch (e: unknown) {
      return { ok: false, message: (e as Error).message }
    }
  }

  if (trimmed.startsWith('/move node ')) {
    const rest = trimmed.slice('/move node '.length).trim()
    const spaceIdx = rest.indexOf(' ')
    if (spaceIdx === -1) return { ok: false, message: 'Usage: /move node <ref> <list-name>' }
    const ref = rest.slice(0, spaceIdx).trim()
    const destListName = rest.slice(spaceIdx + 1).trim()
    const node = resolveNode(ref, nodes)
    if (!node) return { ok: false, message: `Node "${ref}" not found.` }
    try {
      // Find destination list across all folders
      const folders = await getFolders()
      let destListId: string | undefined
      for (const folder of folders) {
        const lsts = await getLists(folder.id)
        const found = lsts.find((l) => l.name.toLowerCase() === destListName.toLowerCase())
        if (found) {
          destListId = found.id
          break
        }
      }
      if (!destListId) return { ok: false, message: `List "${destListName}" not found.` }
      await moveNode(node.id, null, 0)
      ctx.refetch?.()
      return { ok: true, message: `✓ Moved "${node.title}" to "${destListName}"` }
    } catch (e: unknown) {
      return { ok: false, message: (e as Error).message }
    }
  }

  // ── /edit node ... <property> and /add node ... <property> ───────────────
  const editNodeMatch = trimmed.match(/^\/(edit|add|delete) node (.+?) \.\.\. (\S+)(?:\s+(.*))?$/)
  if (editNodeMatch) {
    const verb = editNodeMatch[1]! as 'edit' | 'add' | 'delete'
    const ref = editNodeMatch[2]!.trim()
    const property = editNodeMatch[3]!.trim()
    const value = (editNodeMatch[4] ?? '').trim()

    const node = resolveNode(ref, nodes)
    if (!node) return { ok: false, message: `Node "${ref}" not found.` }

    try {
      switch (property) {
        case 'title':
          if (!value) return { ok: false, message: 'New title required.' }
          await updateNode(node.id, { title: value })
          ctx.refetch?.()
          return { ok: true, message: `✓ Renamed to "${value}"` }

        case 'status': {
          const statusMap: Record<string, string> = {
            'NOT-DONE': 'TODO',
            'IN-PROGRESS': 'IN_PROGRESS',
            DONE: 'DONE',
          }
          if (verb === 'delete') {
            await updateNode(node.id, { status: 'TODO' })
          } else {
            const mapped = statusMap[value.toUpperCase()]
            if (!mapped)
              return { ok: false, message: `Invalid status. Use NOT-DONE, IN-PROGRESS, or DONE.` }
            await updateNode(node.id, { status: mapped as 'TODO' | 'IN_PROGRESS' | 'DONE' })
          }
          ctx.refetch?.()
          return { ok: true, message: `✓ Status updated` }
        }

        case 'priority': {
          const priorityMap: Record<string, string> = { LOW: 'LOW', MEDIUM: 'MEDIUM', HIGH: 'HIGH' }
          if (verb === 'delete') {
            await updateNode(node.id, { priority: null })
          } else {
            const mapped = priorityMap[value.toUpperCase()]
            if (!mapped)
              return { ok: false, message: `Invalid priority. Use LOW, MEDIUM, or HIGH.` }
            await updateNode(node.id, { priority: mapped as 'LOW' | 'MEDIUM' | 'HIGH' })
          }
          ctx.refetch?.()
          return { ok: true, message: `✓ Priority updated` }
        }

        case 'start-date': {
          if (verb === 'delete') {
            await updateNode(node.id, { startAt: null })
          } else {
            const iso = parseDate(value)
            if (!iso) return { ok: false, message: 'Invalid date. Use DD-MM-YYYY.' }
            await updateNode(node.id, { startAt: iso })
          }
          ctx.refetch?.()
          return { ok: true, message: `✓ Start date updated` }
        }

        case 'end-date': {
          if (verb === 'delete') {
            await updateNode(node.id, { endAt: null })
          } else {
            const iso = parseDate(value)
            if (!iso) return { ok: false, message: 'Invalid date. Use DD-MM-YYYY.' }
            await updateNode(node.id, { endAt: iso })
          }
          ctx.refetch?.()
          return { ok: true, message: `✓ End date updated` }
        }

        case 'start-time': {
          if (verb === 'delete') {
            await updateNode(node.id, { startAt: null })
          } else {
            const iso = parseTime(value, node.startAt ?? undefined)
            if (!iso) return { ok: false, message: 'Invalid time. Use HH:MM AM/PM.' }
            await updateNode(node.id, { startAt: iso })
          }
          ctx.refetch?.()
          return { ok: true, message: `✓ Start time updated` }
        }

        case 'end-time': {
          if (verb === 'delete') {
            await updateNode(node.id, { endAt: null })
          } else {
            const iso = parseTime(value, node.endAt ?? undefined)
            if (!iso) return { ok: false, message: 'Invalid time. Use HH:MM AM/PM.' }
            await updateNode(node.id, { endAt: iso })
          }
          ctx.refetch?.()
          return { ok: true, message: `✓ End time updated` }
        }

        case 'tag': {
          if (!value && verb !== 'delete') return { ok: false, message: 'Tag name required.' }
          // Tags by name need a tag ID. For now, signal the screen to handle.
          return {
            ok: false,
            message: 'Tag operations require a tag ID. Use /tags to list available tags.',
          }
        }

        case 'note': {
          if (verb === 'delete') {
            await updateNode(node.id, { notes: null })
          } else {
            if (!value) return { ok: false, message: 'Note text required.' }
            await updateNode(node.id, { notes: value })
          }
          ctx.refetch?.()
          return { ok: true, message: `✓ Note updated` }
        }

        case 'position': {
          const pos = parseInt(value, 10)
          if (isNaN(pos)) return { ok: false, message: 'Position must be a number.' }
          await moveNode(node.id, node.parentId ?? null, pos - 1)
          ctx.refetch?.()
          return { ok: true, message: `✓ Node moved to position ${pos}` }
        }

        default:
          return { ok: false, message: `Unknown property "${property}".` }
      }
    } catch (e: unknown) {
      return { ok: false, message: (e as Error).message }
    }
  }

  return { ok: false, message: `Unknown command: ${trimmed}` }
}
