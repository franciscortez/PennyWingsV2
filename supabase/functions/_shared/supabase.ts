import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js'

import type { FunctionHttpContext } from './http.ts'

const statelessAuthOptions = {
  autoRefreshToken: false,
  detectSessionInUrl: false,
  persistSession: false,
}

export const getBearerAuthorization = (request: Request) => {
  const authorization = request.headers.get('Authorization')
  return authorization?.startsWith('Bearer ') ? authorization : null
}

export const createStatelessSupabaseClient = (
  supabaseUrl: string,
  apiKey: string,
  authorization?: string,
) =>
  createClient(supabaseUrl, apiKey, {
    auth: statelessAuthOptions,
    ...(authorization
      ? { global: { headers: { Authorization: authorization } } }
      : {}),
  })

export const getAuthenticatedCaller = async (
  supabaseUrl: string,
  supabaseAnonKey: string,
  authorization: string,
): Promise<
  | { client: SupabaseClient; user: User }
  | { client: null; user: null }
> => {
  const client = createStatelessSupabaseClient(
    supabaseUrl,
    supabaseAnonKey,
    authorization,
  )
  const {
    data: { user },
    error,
  } = await client.auth.getUser()

  return error || !user
    ? { client: null, user: null }
    : { client, user }
}

export const authenticateRequest = async (
  request: Request,
  http: FunctionHttpContext,
  supabaseUrl: string,
  supabaseAnonKey: string,
): Promise<
  | { errorResponse: Response }
  | { client: SupabaseClient; user: User }
> => {
  const authorization = getBearerAuthorization(request)
  if (!authorization) {
    return {
      errorResponse: http.jsonResponse({ error: 'Authentication is required.' }, 401),
    }
  }

  const caller = await getAuthenticatedCaller(supabaseUrl, supabaseAnonKey, authorization)
  if (!caller.user || !caller.client) {
    return {
      errorResponse: http.jsonResponse({ error: 'Your session has expired.' }, 401),
    }
  }

  return { client: caller.client, user: caller.user }
}
