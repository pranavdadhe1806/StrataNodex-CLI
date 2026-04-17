// API Error wrapper class
export class ApiError extends Error {
  statusCode: number
  userMessage: string
  originalError?: unknown

  constructor(statusCode: number, userMessage: string, originalError?: unknown) {
    super(userMessage)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.userMessage = userMessage
    this.originalError = originalError
  }
}
