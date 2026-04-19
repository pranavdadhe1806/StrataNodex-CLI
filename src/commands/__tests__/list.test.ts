import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { Folder, List, Node } from '../../types/index.js'

vi.mock('../../api/client.js', () => ({
  getFolders: vi.fn(),
  getLists: vi.fn(),
  getNodes: vi.fn(),
}))

vi.mock('../../utils/auth.js', () => ({
  getToken: vi.fn(),
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

import { getFolders, getLists, getNodes } from '../../api/client.js'
import { getToken } from '../../utils/auth.js'
import { runList } from '../list.js'
import { ApiError } from '../../api/ApiError.js'

const mockGetFolders = vi.mocked(getFolders)
const mockGetLists = vi.mocked(getLists)
const mockGetNodes = vi.mocked(getNodes)
const mockGetToken = vi.mocked(getToken)

const folder: Folder = {
  id: 'f1',
  name: 'Work',
  position: 0,
  userId: 'u1',
  createdAt: '',
  updatedAt: '',
}
const list: List = {
  id: 'l1',
  name: 'Project A',
  position: 0,
  folderId: 'f1',
  userId: 'u1',
  createdAt: '',
  updatedAt: '',
}
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

describe('runList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    mockGetToken.mockReturnValue('valid-token')
  })

  it('shows folders and lists at depth 0', async () => {
    mockGetFolders.mockResolvedValue([folder])
    mockGetLists.mockResolvedValue([list])
    const spy = vi.spyOn(console, 'log')
    await runList({ depth: 0 })
    const output = spy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(output).toContain('Work')
    expect(output).toContain('Project A')
    expect(mockGetNodes).not.toHaveBeenCalled()
  })

  it('shows nodes at depth 1', async () => {
    mockGetFolders.mockResolvedValue([folder])
    mockGetLists.mockResolvedValue([list])
    mockGetNodes.mockResolvedValue([node])
    const spy = vi.spyOn(console, 'log')
    await runList({ depth: 1 })
    const output = spy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(output).toContain('Fix bug')
  })

  it('shows error when not logged in', async () => {
    mockGetToken.mockReturnValue(undefined)
    const spy = vi.spyOn(console, 'log')
    await runList({ depth: 0 })
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Not logged in'))).toBe(true)
    expect(mockGetFolders).not.toHaveBeenCalled()
  })

  it('shows error when API fails', async () => {
    mockGetFolders.mockRejectedValue(new ApiError(500, 'Server error'))
    const spy = vi.spyOn(console, 'log')
    await runList({ depth: 0 })
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Server error'))).toBe(true)
  })
})
