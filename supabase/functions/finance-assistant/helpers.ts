import { z } from 'zod'

export const HISTORY_LIMIT = 12
export const MAX_REQUEST_BYTES = 50_000
export const OPENROUTER_TIMEOUT_MS = 30_000

export const allowedOrigins = new Set([
  'http://localhost:5173',
  'https://pennywings.vercel.app',
  'https://stepanie-truceless-absentmindedly.ngrok-free.dev',
])

const baseCorsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
}

export const getCorsHeaders = (origin: string | null) =>
  origin && allowedOrigins.has(origin)
    ? { ...baseCorsHeaders, 'Access-Control-Allow-Origin': origin }
    : baseCorsHeaders

export const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        content: z.string().trim().min(1).max(4_000),
        role: z.enum(['user', 'assistant']),
      }),
    )
    .max(HISTORY_LIMIT),
  question: z.string().trim().min(1).max(1_200),
})

export const openRouterResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().trim().min(1),
        }),
      }),
    )
    .min(1),
  model: z.string().optional(),
})

export const toNumber = (value: unknown) => {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

export const toDateValue = (date: Date) => date.toISOString().slice(0, 10)

export const getPeriodStart = (period: string, now: Date) => {
  if (period === 'weekly') {
    const start = new Date(now)
    start.setUTCDate(now.getUTCDate() - now.getUTCDay())
    return toDateValue(start)
  }

  if (period === 'yearly') {
    return toDateValue(new Date(Date.UTC(now.getUTCFullYear(), 0, 1)))
  }

  return toDateValue(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
  )
}

export const firstRelation = (value: unknown): Record<string, unknown> | null => {
  const relation = Array.isArray(value) ? value[0] : value
  return relation && typeof relation === 'object'
    ? (relation as Record<string, unknown>)
    : null
}

export const relationName = (value: unknown, ...keys: string[]) => {
  const relation = firstRelation(value)

  for (const key of keys) {
    const candidate = relation?.[key]
    if (typeof candidate === 'string' && candidate.trim()) return candidate
  }

  return null
}

export const relationNumber = (value: unknown, key: string) => {
  const candidate = firstRelation(value)?.[key]
  return candidate === null || candidate === undefined ? null : toNumber(candidate)
}

export const getFreeModel = (envModel: string | undefined) => {
  if (envModel === 'openrouter/free' || envModel?.endsWith(':free')) {
    return envModel
  }

  return 'openrouter/free'
}

export const getSafeProviderStatus = (status: number) => {
  if ([400, 401, 402, 403, 413, 429].includes(status)) return status
  return 503
}
