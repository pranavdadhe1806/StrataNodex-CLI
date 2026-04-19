import Conf from 'conf'

interface AuthStore {
  token?: string
}

const store = new Conf<AuthStore>({ projectName: 'stratanodex' })

export function saveToken(token: string): void {
  store.set('token', token)
}

export function getToken(): string | undefined {
  return store.get('token')
}

export function clearToken(): void {
  store.delete('token')
}
