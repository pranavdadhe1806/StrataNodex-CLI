import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../utils/auth.js', () => ({
  getToken: vi.fn(),
  clearToken: vi.fn(),
}))

import { getToken, clearToken } from '../../utils/auth.js'
import { runLogout } from '../logout.js'

const mockGetToken = vi.mocked(getToken)
const mockClearToken = vi.mocked(clearToken)

describe('runLogout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('calls clearToken when logged in', () => {
    mockGetToken.mockReturnValue('sometoken')
    runLogout()
    expect(mockClearToken).toHaveBeenCalledOnce()
  })

  it('prints logged out message when token exists', () => {
    mockGetToken.mockReturnValue('sometoken')
    const spy = vi.spyOn(console, 'log')
    runLogout()
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Logged out'))).toBe(true)
  })

  it('does NOT call clearToken when no token', () => {
    mockGetToken.mockReturnValue(undefined)
    runLogout()
    expect(mockClearToken).not.toHaveBeenCalled()
  })

  it('prints not logged in message when no token', () => {
    mockGetToken.mockReturnValue(undefined)
    const spy = vi.spyOn(console, 'log')
    runLogout()
    expect(spy.mock.calls.some((c) => String(c[0]).includes('not logged in'))).toBe(true)
  })
})
