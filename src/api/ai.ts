// AI API — calls the backend AI endpoints using the shared http client.

import axios from 'axios'
import { getConfig } from '../config.js'
import { getToken } from '../utils/auth.js'

const http = axios.create({ timeout: 60_000 }) // AI calls can be slow

http.interceptors.request.use((config) => {
  config.baseURL = getConfig().apiUrl
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AiOperation {
  op: string
  [key: string]: unknown
}

export interface AiChatResponse {
  operations: AiOperation[]
  confirmation: string | null
  followUpQuestion: string | null
  clarificationNeeded: string | null
  usage: { used: number; limit: number }
  sessionId: string
}

export interface AiSession {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface AiSessionDetail extends AiSession {
  messages: AiSessionMessage[]
}

export interface AiSessionMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

// ─── API functions ──────────────────────────────────────────────────────────

export const chatWithAi = (
  message: string,
  sessionId: string | null,
  currentContext?: { folderId?: string; listId?: string }
): Promise<AiChatResponse> =>
  http
    .post<AiChatResponse>('/api/ai/chat', { message, sessionId, currentContext })
    .then((r) => r.data)

export const getAiSessions = (): Promise<AiSession[]> =>
  http.get<AiSession[]>('/api/ai/sessions').then((r) => r.data)

export const getAiSession = (id: string): Promise<AiSessionDetail> =>
  http.get<AiSessionDetail>(`/api/ai/sessions/${id}`).then((r) => r.data)

export const deleteAiSession = (id: string): Promise<void> =>
  http.delete(`/api/ai/sessions/${id}`).then(() => undefined)
