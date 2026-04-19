export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly raw?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
