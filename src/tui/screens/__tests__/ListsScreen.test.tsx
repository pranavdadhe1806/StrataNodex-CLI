import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'ink-testing-library'
import { ListsScreen } from '../ListsScreen.js'
import type { ActionHandlers } from '../../types.js'

vi.mock('../../hooks/useLists.js', () => ({
  useLists: vi.fn().mockReturnValue({
    lists: [
      {
        id: 'l1',
        name: 'Tasks',
        position: 0,
        folderId: 'f1',
        userId: 'u1',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'l2',
        name: 'Ideas',
        position: 1,
        folderId: 'f1',
        userId: 'u1',
        createdAt: '',
        updatedAt: '',
      },
    ],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('../../../api/client.js', () => ({
  createList: vi.fn(),
  deleteList: vi.fn(),
}))

describe('ListsScreen', () => {
  const push = vi.fn()
  const pop = vi.fn()
  let handlers: Partial<ActionHandlers> = {}
  const registerActions = (h: Partial<ActionHandlers>) => {
    handlers = h
  }

  beforeEach(() => {
    push.mockClear()
    pop.mockClear()
    handlers = {}
  })

  it('renders list items and breadcrumb', async () => {
    const { lastFrame } = render(
      React.createElement(ListsScreen, {
        push,
        pop,
        registerActions,
        folderId: 'f1',
        folderName: 'Work',
      })
    )
    await new Promise((r) => setTimeout(r, 50))
    expect(lastFrame()).toContain('Work')
    expect(lastFrame()).toContain('Tasks')
    expect(lastFrame()).toContain('Ideas')
  })

  it('moves cursor down on onDown()', async () => {
    const { lastFrame } = render(
      React.createElement(ListsScreen, {
        push,
        pop,
        registerActions,
        folderId: 'f1',
        folderName: 'Work',
      })
    )
    await new Promise((r) => setTimeout(r, 50))
    expect(lastFrame()).toContain('❯ Tasks')
    handlers.onDown?.()
    await new Promise((r) => setTimeout(r, 50))
    expect(lastFrame()).toContain('❯ Ideas')
  })

  it('calls pop on onBack()', async () => {
    render(
      React.createElement(ListsScreen, {
        push,
        pop,
        registerActions,
        folderId: 'f1',
        folderName: 'Work',
      })
    )
    await new Promise((r) => setTimeout(r, 50))
    handlers.onBack?.()
    expect(pop).toHaveBeenCalled()
  })

  it('calls push with tree screen on onEnter()', async () => {
    render(
      React.createElement(ListsScreen, {
        push,
        pop,
        registerActions,
        folderId: 'f1',
        folderName: 'Work',
      })
    )
    await new Promise((r) => setTimeout(r, 50))
    handlers.onEnter?.()
    await new Promise((r) => setTimeout(r, 50))
    expect(push).toHaveBeenCalledWith('tree', {
      listId: 'l1',
      listName: 'Tasks',
      folderName: 'Work',
    })
  })
})
