import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('../../config.js', () => ({
  getConfig: vi.fn(() => ({
    apiUrl: 'https://stratanodex-backend.onrender.com',
    verbose: false,
  })),
  saveApiUrl: vi.fn(),
}))

import { runConfig } from '../config.js'
import { saveApiUrl } from '../../config.js'

const mockSaveApiUrl = vi.mocked(saveApiUrl)

describe('runConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('list shows apiUrl and verbose', () => {
    const spy = vi.spyOn(console, 'log')
    runConfig('list')
    const output = spy.mock.calls.map((c) => String(c[0])).join('\n')
    expect(output).toContain('apiUrl')
    expect(output).toContain('stratanodex-backend.onrender.com')
  })

  it('get returns value for known key', () => {
    const spy = vi.spyOn(console, 'log')
    runConfig('get', 'apiUrl')
    expect(
      spy.mock.calls.some((c) => String(c[0]).includes('stratanodex-backend.onrender.com'))
    ).toBe(true)
  })

  it('get shows error for unknown key', () => {
    const spy = vi.spyOn(console, 'log')
    runConfig('get', 'unknownKey')
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Unknown config key'))).toBe(true)
  })

  it('set calls saveApiUrl for apiUrl key', () => {
    runConfig('set', 'apiUrl', 'http://localhost:3000')
    expect(mockSaveApiUrl).toHaveBeenCalledWith('http://localhost:3000')
  })

  it('set shows success message', () => {
    const spy = vi.spyOn(console, 'log')
    runConfig('set', 'apiUrl', 'http://localhost:3000')
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Set apiUrl'))).toBe(true)
  })

  it('set shows error for unknown key', () => {
    const spy = vi.spyOn(console, 'log')
    runConfig('set', 'notAKey', 'value')
    expect(spy.mock.calls.some((c) => String(c[0]).includes('Unknown config key'))).toBe(true)
    expect(mockSaveApiUrl).not.toHaveBeenCalled()
  })
})
