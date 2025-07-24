export class OperationFailedError extends Error {
  statusCode: number
  detail?: string;
  constructor(message: string, detail?: string) {
    super(message)
    this.name = 'OperationFailedError'
    this.statusCode = 500
    this.detail = detail;

    Object.setPrototypeOf(this, OperationFailedError.prototype)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}
