export type NodeStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH'

// Values match what the backend actually sends — from API.md
export type OtpType = 'VERIFY_EMAIL' | 'VERIFY_PHONE' | 'TWO_FACTOR' | 'PASSWORD_RESET'
export type OtpChannel = 'EMAIL' | 'SMS'

export interface User {
  id: string
  email: string
  phone: string | null
  name: string | null
  isEmailVerified: boolean
  isPhoneVerified: boolean
  twoFactorEnabled: boolean
  twoFactorMethod: string | null
  dayStartTime: string
  dayEndTime: string
  createdAt: string
  updatedAt?: string
}

export interface Folder {
  id: string
  name: string
  position: number
  userId: string
  createdAt: string
  updatedAt: string
}

export interface List {
  id: string
  name: string
  position: number
  folderId: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  name: string
  color: string
  listId: string | null
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Node {
  id: string
  title: string
  status: NodeStatus
  priority: Priority | null
  notes: string | null
  startAt: string | null
  endAt: string | null
  reminderAt: string | null
  /** Web only — never read or write from CLI */
  canvasX: number | null
  /** Web only — never read or write from CLI */
  canvasY: number | null
  position: number
  parentId: string | null
  listId: string
  userId: string
  createdAt: string
  updatedAt: string
  children: Node[]
  tags: Array<{ tag: Tag }>
}

export interface DailyScore {
  id: string
  userId: string
  listId: string | null
  date: string
  totalNodes: number
  doneNodes: number
  points: number
  createdAt: string
}

export type LoginResponse =
  | { user: User; token: string }
  | { requiresTwoFactor: true; userId: string }

export interface ApiErrorResponse {
  error: string
}
