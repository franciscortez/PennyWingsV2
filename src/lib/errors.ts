type AppErrorOptions = {
  cause?: unknown
  code?: string
}

const getErrorCode = (error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code
  }

  return undefined
}

export class AppError extends Error {
  readonly code?: string

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, { cause: options.cause })
    this.name = 'AppError'
    this.code = options.code
  }

  static from(error: unknown, fallback = 'Something went wrong.') {
    if (error instanceof AppError) {
      return error
    }

    if (error instanceof Error) {
      return new AppError(error.message || fallback, {
        cause: error,
        code: getErrorCode(error),
      })
    }

    return new AppError(fallback, { cause: error })
  }
}
