export class DuplicateError extends Error {
  statusCode: number
  detail?: string;
  constructor(message: string, detail?: string) {
    super(message)
    this.name = 'DuplicateError'
    this.statusCode = 409
    this.detail = detail;

    Object.setPrototypeOf(this, DuplicateError.prototype)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}
