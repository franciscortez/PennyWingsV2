import type { ZodError } from 'zod'

export function getZodErrorMessage(error: ZodError, fallback: string) {
  return error.issues[0]?.message ?? fallback
}
