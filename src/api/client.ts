import axios from 'axios'
import { getConfig } from '../config.js'
import { getToken, clearToken } from '../utils/auth.js'
import { logger } from '../utils/logger.js'
import { ApiError } from './ApiError.js'
import type { User, Folder, List, Node, Tag, DailyScore, LoginResponse } from '../types/index.js'

const http = axios.create({
  timeout: 10_000,
})

http.interceptors.request.use((config) => {
  config.baseURL = getConfig().apiUrl
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response as { status: number; data: { error?: unknown } }
      const rawError = data?.error
      const msg =
        typeof rawError === 'string'
          ? rawError
          : rawError && typeof rawError === 'object' && 'fieldErrors' in rawError
            ? Object.entries((rawError as Record<string, Record<string, string[]>>).fieldErrors)
                .map(([k, v]) => `${k}: ${v.join(', ')}`)
                .join('; ')
            : 'An unexpected error occurred.'
      logger.error(`API ${status}: ${msg}`, { status, url: error.config?.url })
      if (status === 401) {
        clearToken()
        throw new ApiError(401, 'Session expired. Please log in again.', error)
      }
      if (status === 429) {
        throw new ApiError(429, 'Too many requests, please wait a moment.', error)
      }
      if (status >= 500) {
        throw new ApiError(
          status,
          typeof rawError === 'string' ? rawError : 'Server error. Try again later.',
          error
        )
      }
      throw new ApiError(status, msg, error)
    }
    logger.error('Network error: cannot reach server')
    throw new ApiError(0, 'Cannot reach server. Check your connection.', error)
  }
)

// ── Health ────────────────────────────────────────────────────────────────────

export const healthCheck = (): Promise<{ status: string; timestamp: string }> =>
  http.get<{ status: string; timestamp: string }>('/health').then((r) => r.data)

// ── Auth ──────────────────────────────────────────────────────────────────────

export const login = (email: string, password: string): Promise<LoginResponse> =>
  http.post<LoginResponse>('/api/auth/login', { email, password }).then((r) => r.data)

export const verify2FA = (userId: string, code: string): Promise<{ user: User; token: string }> =>
  http
    .post<{ user: User; token: string }>('/api/auth/2fa/verify', { userId, code })
    .then((r) => r.data)

export const getMe = (): Promise<User> => http.get<User>('/api/auth/me').then((r) => r.data)

// ── Folders ───────────────────────────────────────────────────────────────────

export const getFolders = (): Promise<Folder[]> =>
  http.get<Folder[]>('/api/folders').then((r) => r.data)

export const createFolder = (name: string, position?: number): Promise<Folder> =>
  http.post<Folder>('/api/folders', { name, position }).then((r) => r.data)

export const updateFolder = (
  id: string,
  data: { name?: string; position?: number }
): Promise<Folder> => http.patch<Folder>(`/api/folders/${id}`, data).then((r) => r.data)

export const deleteFolder = (id: string): Promise<void> =>
  http.delete(`/api/folders/${id}`).then(() => undefined)

// ── Lists ─────────────────────────────────────────────────────────────────────

export const getLists = (folderId: string): Promise<List[]> =>
  http.get<List[]>(`/api/folders/${folderId}/lists`).then((r) => r.data)

export const createList = (name: string, folderId: string, position?: number): Promise<List> =>
  http.post<List>('/api/lists', { name, folderId, position }).then((r) => r.data)

export const updateList = (id: string, data: { name?: string; position?: number }): Promise<List> =>
  http.patch<List>(`/api/lists/${id}`, data).then((r) => r.data)

export const deleteList = (id: string): Promise<void> =>
  http.delete(`/api/lists/${id}`).then(() => undefined)

// ── Nodes ─────────────────────────────────────────────────────────────────────

export const getNodes = (listId: string): Promise<Node[]> =>
  http.get<Node[]>(`/api/lists/${listId}/nodes`).then((r) => r.data)

export const getNode = (id: string): Promise<Node> =>
  http.get<Node>(`/api/nodes/${id}`).then((r) => r.data)

export const createRootNode = (
  listId: string,
  data: Partial<Node> & { title: string }
): Promise<Node> =>
  http.post<Node>(`/api/lists/${listId}/nodes`, { ...data, listId }).then((r) => r.data)

export const createChildNode = (
  parentId: string,
  data: Partial<Node> & { title: string }
): Promise<Node> => http.post<Node>(`/api/nodes/${parentId}/children`, data).then((r) => r.data)

export const updateNode = (id: string, data: Partial<Node>): Promise<Node> =>
  http.patch<Node>(`/api/nodes/${id}`, data).then((r) => r.data)

export const moveNode = (id: string, parentId: string | null, position: number): Promise<Node> =>
  http.patch<Node>(`/api/nodes/${id}/move`, { parentId, position }).then((r) => r.data)

export const deleteNode = (id: string): Promise<void> =>
  http.delete(`/api/nodes/${id}`).then(() => undefined)

// ── Tags ──────────────────────────────────────────────────────────────────────

export const getTags = (listId?: string): Promise<Tag[]> =>
  http.get<Tag[]>('/api/tags', { params: listId ? { listId } : {} }).then((r) => r.data)

export const createTag = (name: string, color?: string, listId?: string): Promise<Tag> =>
  http.post<Tag>('/api/tags', { name, color, listId }).then((r) => r.data)

export const updateTag = (id: string, data: { name?: string; color?: string }): Promise<Tag> =>
  http.patch<Tag>(`/api/tags/${id}`, data).then((r) => r.data)

export const deleteTag = (id: string): Promise<void> =>
  http.delete(`/api/tags/${id}`).then(() => undefined)

export const attachTag = (nodeId: string, tagId: string): Promise<void> =>
  http.post(`/api/nodes/${nodeId}/tags/${tagId}`).then(() => undefined)

export const detachTag = (nodeId: string, tagId: string): Promise<void> =>
  http.delete(`/api/nodes/${nodeId}/tags/${tagId}`).then(() => undefined)

// ── Daily ─────────────────────────────────────────────────────────────────────

export const getDailyToday = (): Promise<Node[]> =>
  http.get<Node[]>('/api/daily/today').then((r) => r.data)

export const getDailyOverdue = (): Promise<Node[]> =>
  http.get<Node[]>('/api/daily/overdue').then((r) => r.data)

export const getDailyScore = (date: string): Promise<DailyScore> =>
  http.get<DailyScore>(`/api/daily/${date}`).then((r) => r.data)

// ── Scores ────────────────────────────────────────────────────────────────────

export const getScores = (limit?: number, listId?: string): Promise<DailyScore[]> =>
  http.get<DailyScore[]>('/api/scores', { params: { limit, listId } }).then((r) => r.data)

export const getStreak = (): Promise<{ streak: number }> =>
  http.get<{ streak: number }>('/api/scores/streak').then((r) => r.data)
