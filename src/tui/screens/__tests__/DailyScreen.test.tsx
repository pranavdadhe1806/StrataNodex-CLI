import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'ink-testing-library'
import { DailyScreen } from '../DailyScreen.js'
import type { ActionHandlers } from '../../types.js'

vi.mock('../../../api/client.js', () => {
  const mk = (id: string, title: string) => ({
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
    position: 0,
    parentId: null,
    listId: 'l1',
    userId: 'u1',
    createdAt: '',
    updatedAt: '',
    children: [],
    tags: [],
  })
  return {
    getDailyToday: vi.fn().mockResolvedValue([mk('n1', 'Fix bug')]),
    getDailyOverdue: vi.fn().mockResolvedValue([mk('n2', 'Old task')]),
    updateNode: vi.fn(),
  }
})

describe('DailyScreen', () => {
  const push = vi.fn()
  const pop = vi.fn()
  const replaceScreen = vi.fn()
  let handlers: Partial<ActionHandlers> = {}
  const registerActions = (h: Partial<ActionHandlers>) => {
    handlers = h
  }

  beforeEach(() => {
    push.mockClear()
    pop.mockClear()
    handlers = {}
  })

  it('renders today and overdue sections', async () => {
    const { lastFrame } = render(React.createElement(DailyScreen, { push, pop, replaceScreen, registerActions }))
    await new Promise((r) => setTimeout(r, 100))
    expect(lastFrame()).toContain('Today')
    expect(lastFrame()).toContain('Overdue')
  })

  it('renders today and overdue nodes', async () => {
    const { lastFrame } = render(React.createElement(DailyScreen, { push, pop, replaceScreen, registerActions }))
    await new Promise((r) => setTimeout(r, 100))
    expect(lastFrame()).toContain('Fix bug')
    expect(lastFrame()).toContain('Old task')
  })

  it('calls pop on onBack()', async () => {
    render(React.createElement(DailyScreen, { push, pop, replaceScreen, registerActions }))
    await new Promise((r) => setTimeout(r, 100))
    handlers.onBack?.()
    expect(pop).toHaveBeenCalled()
  })
})
