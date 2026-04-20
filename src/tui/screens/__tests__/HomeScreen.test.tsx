import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'ink-testing-library'
import { HomeScreen } from '../HomeScreen.js'
import type { ActionHandlers } from '../../types.js'

vi.mock('../../hooks/useFolders.js', () => ({
  useFolders: vi.fn().mockReturnValue({
    folders: [
      { id: 'f1', name: 'Work', position: 0, userId: 'u1', createdAt: '', updatedAt: '' },
      { id: 'f2', name: 'Personal', position: 1, userId: 'u1', createdAt: '', updatedAt: '' },
    ],
    loading: false,
    error: null,
    refetch: vi.fn(),
  }),
}))

vi.mock('../../../api/client.js', () => ({
  createFolder: vi.fn(),
  deleteFolder: vi.fn(),
}))

describe('HomeScreen', () => {
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

  it('renders folder list', async () => {
    const { lastFrame } = render(React.createElement(HomeScreen, { push, pop, registerActions }))
    await new Promise((r) => setTimeout(r, 50))
    expect(lastFrame()).toContain('Work')
    expect(lastFrame()).toContain('Personal')
  })

  it('moves cursor down on onDown()', async () => {
    const { lastFrame } = render(React.createElement(HomeScreen, { push, pop, registerActions }))
    await new Promise((r) => setTimeout(r, 50))
    expect(lastFrame()).toContain('❯ Work')
    handlers.onDown?.()
    await new Promise((r) => setTimeout(r, 50))
    expect(lastFrame()).toContain('❯ Personal')
  })

  it('calls push with lists screen on onEnter()', async () => {
    render(React.createElement(HomeScreen, { push, pop, registerActions }))
    await new Promise((r) => setTimeout(r, 50))
    handlers.onEnter?.()
    await new Promise((r) => setTimeout(r, 50))
    expect(push).toHaveBeenCalledWith('lists', { folderId: 'f1', folderName: 'Work' })
  })
})
