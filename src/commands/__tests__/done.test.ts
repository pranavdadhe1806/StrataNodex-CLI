import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Node } from '../../types/index.js'

vi.mock('../../api/client.js', () => ({
  getNodes: vi.fn(),
  updateNode: vi.fn(),
}))

const storeData: Record<string, unknown> = {}
vi.mock('conf', () => ({
  default: vi.fn().mockImplementation(() => ({
    get: (k: string) => storeData[k],
    set: (k: string, v: unknown) => {
      storeData[k] = v
    },
  })),
}))

import { getNodes, updateNode } from '../../api/client.js'
import { runDone } from '../done.js'

const mockGetNodes = vi.mocked(getNodes)
const mockUpdateNode = vi.mocked(updateNode)

const node: Node = {
  id: 'n1',
  title: 'Fix bug',
  position: 0,
  parentId: null,
  listId: 'l1',
  status: 'TODO',
  priority: null,
  notes: null,
  startAt: null,
  endAt: null,
  reminderAt: null,
  canvasX: null,
  canvasY: null,
  userId: 'u1',
  createdAt: '',
  updatedAt: '',
  tags: [],
  children: [],
}

describe('runDone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    storeData['lastListId'] = undefined
  })

  it('marks node as done by number using --list flag', async () => {
    mockGetNodes.mockResolvedValue([node])
    mockUpdateNode.mockResolvedValue({ ...node, status: 'DONE' })
    await runDone('1', { list: 'l1' })
    expect(mockUpdateNode).toHaveBeenCalledWith('n1', { status: 'DONE' })
  })

  it('prints success message', async () => {
    mockGetNodes.mockResolvedValue([node])
    mockUpdateNode.mockResolvedValue({ ...node, status: 'DONE' })
    const spy = vi.spyOn(console, 'log')
    await runDone('1', { list: 'l1' })
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Done: Fix bug'))).toBe(true)
  })

  it('shows error when number not found', async () => {
    mockGetNodes.mockResolvedValue([node])
    const spy = vi.spyOn(console, 'log')
    await runDone('99', { list: 'l1' })
    expect(spy.mock.calls.some((c) => String(c[0]).includes('not found'))).toBe(true)
    expect(mockUpdateNode).not.toHaveBeenCalled()
  })

  it('shows helpful message when no active list and no --list flag', async () => {
    const spy = vi.spyOn(console, 'log')
    await runDone('1', {})
    expect(spy.mock.calls.some((c) => String(c[0]).includes('No active list'))).toBe(true)
    expect(mockGetNodes).not.toHaveBeenCalled()
  })

  it('uses lastListId from conf when --list flag is not given', async () => {
    storeData['lastListId'] = 'l1'
    mockGetNodes.mockResolvedValue([node])
    mockUpdateNode.mockResolvedValue({ ...node, status: 'DONE' })
    await runDone('1', {})
    expect(mockGetNodes).toHaveBeenCalledWith('l1')
  })
})
