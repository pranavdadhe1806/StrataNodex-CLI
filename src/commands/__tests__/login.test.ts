import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('ink', async () => {
  const actual = await vi.importActual<typeof import('ink')>('ink')
  return {
    ...actual,
    render: vi.fn().mockReturnValue({ waitUntilExit: () => Promise.resolve() }),
  }
})

vi.mock('../../api/client.js', () => ({
  login: vi.fn(),
  verify2FA: vi.fn(),
}))

vi.mock('../../utils/auth.js', () => ({
  saveToken: vi.fn(),
  getToken: vi.fn(),
  clearToken: vi.fn(),
}))

import { login, verify2FA } from '../../api/client.js'
import { saveToken } from '../../utils/auth.js'
import { ApiError } from '../../api/ApiError.js'

const mockLogin = vi.mocked(login)
const mockVerify2FA = vi.mocked(verify2FA)
const mockSaveToken = vi.mocked(saveToken)

const fakeUser = {
  id: 'u1',
  email: 'a@b.com',
  phone: null,
  name: null,
  isEmailVerified: true,
  isPhoneVerified: false,
  twoFactorEnabled: false,
  twoFactorMethod: null,
  dayStartTime: '08:00',
  dayEndTime: '20:00',
  createdAt: '',
}

describe('login underlying API behaviour', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('saves token on successful login', async () => {
    mockLogin.mockResolvedValue({ user: fakeUser, token: 'tok123' })
    await login('a@b.com', 'pass')
    const result = (await mockLogin.mock.results[0].value) as {
      user: typeof fakeUser
      token: string
    }
    mockSaveToken(result.token)
    expect(mockSaveToken).toHaveBeenCalledWith('tok123')
  })

  it('returns requiresTwoFactor shape for 2FA accounts', async () => {
    mockLogin.mockResolvedValue({ requiresTwoFactor: true, userId: 'uid1' })
    const result = await login('a@b.com', 'pass')
    expect('requiresTwoFactor' in result).toBe(true)
  })

  it('verify2FA saves token on success', async () => {
    mockVerify2FA.mockResolvedValue({ user: fakeUser, token: 'tok456' })
    const result = await verify2FA('uid1', '123456')
    mockSaveToken(result.token)
    expect(mockSaveToken).toHaveBeenCalledWith('tok456')
  })

  it('login throws ApiError on 401', async () => {
    mockLogin.mockRejectedValue(new ApiError(401, 'Invalid email or password.'))
    await expect(login('a@b.com', 'wrong')).rejects.toBeInstanceOf(ApiError)
  })

  it('login throws ApiError on 429', async () => {
    mockLogin.mockRejectedValue(new ApiError(429, 'Too many requests.'))
    await expect(login('a@b.com', 'pass')).rejects.toMatchObject({ statusCode: 429 })
  })
})
