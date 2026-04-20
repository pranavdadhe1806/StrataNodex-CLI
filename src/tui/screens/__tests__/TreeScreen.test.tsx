import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'ink-testing-library'
import { TreeScreen } from '../TreeScreen.js'
import type { ActionHandlers } from '../../types.js'

vi.mock('../../hooks/useTree.js', () => {
  const mk = (id: string, title: string, pos = 0) => ({
    id,
    title,
    status: 'TODO',
    priority: null,
    notes: null,
    startAt: null,
    endAt: null,
    reminderAt: null,
    canvasX: null,
    canvasY: null,
    position: pos,
    parentId: null,
    listId: 'l1',
    userId: 'u1',
    createdAt: '',
    updatedAt: '',
    children: [],
    tags: [],
  })
  return {
    useTree: vi.fn().mockReturnValue({
      nodes: [mk('n1', 'Task One'), mk('n2', 'Task Two', 1)],
      flatNodes: [mk('n1', 'Task One'), mk('n2', 'Task Two', 1)],
      expandedIds: new Set(['n1', 'n2']),
      toggleExpand: vi.fn(),
      numberMap: new Map([
        ['n1', '1'],
        ['n2', '2'],
      ]),
      loading: false,
      error: null,
      refetch: vi.fn(),
    }),
  }
})

vi.mock('../../../api/client.js', () => ({
  createRootNode: vi.fn(),
  updateNode: vi.fn(),
}))

describe('TreeScreen', () => {
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

  it('renders node titles', async () => {
    const { lastFrame } = render(
      React.createElement(TreeScreen, {
        push,
        pop,
        registerActions,
        listId: 'l1',
        listName: 'Tasks',
        folderName: 'Work',
      })
    )
    await new Promise((r) => setTimeout(r, 50))
    expect(lastFrame()).toContain('Task One')
    expect(lastFrame()).toContain('Task Two')
  })

  it('shows breadcrumb', async () => {
    const { lastFrame } = render(
      React.createElement(TreeScreen, {
        push,
        pop,
        registerActions,
        listId: 'l1',
        listName: 'Tasks',
        folderName: 'Work',
      })
    )
    await new Promise((r) => setTimeout(r, 50))
    expect(lastFrame()).toContain('Work')
    expect(lastFrame()).toContain('Tasks')
  })

  it('moves cursor down on onDown()', async () => {
    const { lastFrame } = render(
      React.createElement(TreeScreen, {
        push,
        pop,
        registerActions,
        listId: 'l1',
        listName: 'Tasks',
        folderName: 'Work',
      })
    )
    await new Promise((r) => setTimeout(r, 50))
    handlers.onDown?.()
    await new Promise((r) => setTimeout(r, 50))
    const frame = lastFrame() ?? ''
    expect(frame).toContain('Task Two')
  })

  it('calls pop on onBack()', async () => {
    render(
      React.createElement(TreeScreen, {
        push,
        pop,
        registerActions,
        listId: 'l1',
        listName: 'Tasks',
        folderName: 'Work',
      })
    )
    await new Promise((r) => setTimeout(r, 50))
    handlers.onBack?.()
    expect(pop).toHaveBeenCalled()
  })
})
