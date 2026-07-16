import { corsHeaders as supabaseCorsHeaders } from '@supabase/supabase-js/cors'

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://pennywings.vercel.app',
  'https://stepanie-truceless-absentmindedly.ngrok-free.dev',
])

const baseCorsHeaders: Record<string, string> = {
  'Access-Control-Allow-Headers':
    supabaseCorsHeaders['Access-Control-Allow-Headers'],
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
  'Cache-Control': 'no-store',
  Vary: 'Origin',
  'X-Content-Type-Options': 'nosniff',
}

type JsonResponse = (body: unknown, status?: number) => Response

export type FunctionHttpContext = {
  corsHeaders: Record<string, string>
  jsonResponse: JsonResponse
  originAllowed: boolean
}

const getCorsHeaders = (origin: string | null) =>
  origin && allowedOrigins.has(origin)
    ? { ...baseCorsHeaders, 'Access-Control-Allow-Origin': origin }
    : baseCorsHeaders

export const createFunctionHttpContext = (
  request: Request,
): FunctionHttpContext => {
  const origin = request.headers.get('Origin')
  const originAllowed = !origin || allowedOrigins.has(origin)
  const corsHeaders = getCorsHeaders(origin)

  return {
    corsHeaders,
    jsonResponse: (body, status = 200) =>
      new Response(JSON.stringify(body), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status,
      }),
    originAllowed,
  }
}

export const guardFunctionRequest = (
  request: Request,
  context: FunctionHttpContext,
) => {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: context.corsHeaders,
      status: context.originAllowed ? 204 : 403,
    })
  }

  if (!context.originAllowed) {
    return context.jsonResponse({ error: 'Origin not allowed.' }, 403)
  }

  if (request.method !== 'POST') {
    return context.jsonResponse({ error: 'Method not allowed.' }, 405)
  }

  return null
}
