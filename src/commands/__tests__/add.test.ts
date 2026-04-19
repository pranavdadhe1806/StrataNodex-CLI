import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Node } from '../../types/index.js'

vi.mock('../../api/client.js', () => ({
  getNodes: vi.fn(),
  createRootNode: vi.fn(),
  createChildNode: vi.fn(),
}))

vi.mock('conf', () => {
  const store: Record<string, unknown> = {}
  return {
    default: vi.fn().mockImplementation(() => ({
      get: (k: string) => store[k],
      set: (k: string, v: unknown) => {
        store[k] = v
      },
    })),
  }
})

import { getNodes, createRootNode, createChildNode } from '../../api/client.js'
import { runAdd } from '../add.js'

const mockGetNodes = vi.mocked(getNodes)
const mockCreateRoot = vi.mocked(createRootNode)
const mockCreateChild = vi.mocked(createChildNode)

const parentNode: Node = {
  id: 'n1',
  title: 'Fix auth bug',
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

describe('runAdd', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('shows error when --list is missing', async () => {
    const spy = vi.spyOn(console, 'log')
    await runAdd('Test task', {})
    expect(spy.mock.calls.some((c) => String(c[0]).includes('--list'))).toBe(true)
    expect(mockCreateRoot).not.toHaveBeenCalled()
  })

  it('creates root node when no --parent given', async () => {
    mockCreateRoot.mockResolvedValue({ ...parentNode, title: 'Test task' })
    await runAdd('Test task', { list: 'l1' })
    expect(mockCreateRoot).toHaveBeenCalledWith('l1', { title: 'Test task' })
  })

  it('prints success after root node creation', async () => {
    mockCreateRoot.mockResolvedValue({ ...parentNode, title: 'Test task' })
    const spy = vi.spyOn(console, 'log')
    await runAdd('Test task', { list: 'l1' })
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Added: Test task'))).toBe(true)
  })

  it('creates child node when --parent given and found', async () => {
    mockGetNodes.mockResolvedValue([parentNode])
    const childNode: Node = { ...parentNode, id: 'n2', title: 'Sub-task', parentId: 'n1' }
    mockCreateChild.mockResolvedValue(childNode)
    await runAdd('Sub-task', { list: 'l1', parent: '1' })
    expect(mockCreateChild).toHaveBeenCalledWith('n1', { title: 'Sub-task' })
  })

  it('shows error when --parent number not found', async () => {
    mockGetNodes.mockResolvedValue([])
    const spy = vi.spyOn(console, 'log')
    await runAdd('Sub-task', { list: 'l1', parent: '99.1' })
    expect(spy.mock.calls.some((c) => String(c[0]).includes('not found'))).toBe(true)
    expect(mockCreateChild).not.toHaveBeenCalled()
  })
})
