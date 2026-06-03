// aiOperationExecutor.ts — Maps Gemini AI operations to CLI API calls.
// Same operation format as the web app's executor, but uses the CLI's API client.

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
} from '../api/client.js'
import type { AiOperation } from '../api/ai.js'

export interface OpResult {
  ok: boolean
  message: string
}

/**
 * Execute a list of AI operations and return result messages.
 * Operations are executed sequentially (order matters — e.g. create folder before list).
 */
export async function executeAiOperations(operations: AiOperation[]): Promise<OpResult[]> {
  const results: OpResult[] = []

  for (const op of operations) {
    try {
      const result = await executeSingle(op)
      results.push(result)
    } catch (err) {
      results.push({ ok: false, message: `${op.op}: ${(err as Error).message}` })
    }
  }

  return results
}

async function executeSingle(op: AiOperation): Promise<OpResult> {
  switch (op.op) {
    // ── Folders ────────────────────────────────────────────────────────────
    case 'createFolder': {
      const f = await createFolder(op.name as string)
      return { ok: true, message: `✓ Created folder "${f.name}"` }
    }
    case 'updateFolder': {
      const data: Record<string, unknown> = {}
      if (op.name) data.name = op.name
      if (op.position !== undefined) data.position = op.position
      await updateFolder(op.folderId as string, data)
      return { ok: true, message: `✓ Updated folder` }
    }
    case 'deleteFolder': {
      await deleteFolder(op.folderId as string)
      return { ok: true, message: `✓ Deleted folder` }
    }

    // ── Lists ──────────────────────────────────────────────────────────────
    case 'createList': {
      const l = await createList(op.name as string, op.folderId as string)
      return { ok: true, message: `✓ Created list "${l.name}"` }
    }
    case 'updateList': {
      const data: Record<string, unknown> = {}
      if (op.name) data.name = op.name
      if (op.position !== undefined) data.position = op.position
      await updateList(op.listId as string, data)
      return { ok: true, message: `✓ Updated list` }
    }
    case 'deleteList': {
      await deleteList(op.listId as string)
      return { ok: true, message: `✓ Deleted list` }
    }

    // ── Nodes ──────────────────────────────────────────────────────────────
    case 'createNode': {
      const nodeData: Record<string, unknown> = { title: op.title as string }
      if (op.status) nodeData.status = op.status
      if (op.priority) nodeData.priority = op.priority
      if (op.startAt) nodeData.startAt = op.startAt
      if (op.endAt) nodeData.endAt = op.endAt
      if (op.notes) nodeData.notes = op.notes
      if (op.reminderAt) nodeData.reminderAt = op.reminderAt
      if (op.tagIds) nodeData.tagIds = op.tagIds
      if (op.color) nodeData.color = op.color
      const n = await createRootNode(op.listId as string, nodeData as { title: string })
      return { ok: true, message: `✓ Created task "${n.title}"` }
    }
    case 'createSubNode': {
      const nodeData: Record<string, unknown> = { title: op.title as string }
      if (op.status) nodeData.status = op.status
      if (op.priority) nodeData.priority = op.priority
      if (op.startAt) nodeData.startAt = op.startAt
      if (op.endAt) nodeData.endAt = op.endAt
      if (op.notes) nodeData.notes = op.notes
      const n = await createChildNode(op.parentId as string, nodeData as { title: string })
      return { ok: true, message: `✓ Created sub-task "${n.title}"` }
    }
    case 'updateNode': {
      const nodeData: Record<string, unknown> = {}
      if (op.title) nodeData.title = op.title
      if (op.status) nodeData.status = op.status
      if (op.priority) nodeData.priority = op.priority
      if (op.startAt !== undefined) nodeData.startAt = op.startAt
      if (op.endAt !== undefined) nodeData.endAt = op.endAt
      if (op.notes !== undefined) nodeData.notes = op.notes
      if (op.reminderAt !== undefined) nodeData.reminderAt = op.reminderAt
      if (op.color !== undefined) nodeData.color = op.color
      await updateNode(op.nodeId as string, nodeData)
      return { ok: true, message: `✓ Updated task` }
    }
    case 'deleteNode': {
      await deleteNode(op.nodeId as string)
      return { ok: true, message: `✓ Deleted task` }
    }
    case 'moveNode': {
      await moveNode(
        op.nodeId as string,
        (op.parentId as string) ?? null,
        (op.position as number) ?? 0
      )
      return { ok: true, message: `✓ Moved task` }
    }

    // ── Tags ──────────────────────────────────────────────────────────────
    case 'attachTag': {
      await attachTag(op.nodeId as string, op.tagId as string)
      return { ok: true, message: `✓ Tag attached` }
    }
    case 'detachTag': {
      await detachTag(op.nodeId as string, op.tagId as string)
      return { ok: true, message: `✓ Tag detached` }
    }

    default:
      return { ok: false, message: `Unknown operation: ${op.op}` }
  }
}
