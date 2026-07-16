import {
  createFunctionHttpContext,
  guardFunctionRequest,
} from '../_shared/http.ts'
import { getEnv, serve } from '../_shared/runtime.ts'
import {
  createStatelessSupabaseClient,
  getAuthenticatedCaller,
  getBearerAuthorization,
} from '../_shared/supabase.ts'

const RECENT_AUTH_WINDOW_MS = 5 * 60 * 1_000
const MAX_CLOCK_SKEW_MS = 30 * 1_000

serve(async (request) => {
  const http = createFunctionHttpContext(request)
  const guardResponse = guardFunctionRequest(request, http)
  if (guardResponse) return guardResponse

  const authorization = getBearerAuthorization(request)
  if (!authorization) {
    return http.jsonResponse({ error: 'Authentication is required.' }, 401)
  }

  const supabaseUrl = getEnv('SUPABASE_URL')
  const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY')
  const supabaseServiceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
    return http.jsonResponse({ error: 'Account deletion is not configured.' }, 503)
  }

  const caller = await getAuthenticatedCaller(
    supabaseUrl,
    supabaseAnonKey,
    authorization,
  )

  if (!caller.user) {
    return http.jsonResponse({ error: 'Your session has expired.' }, 401)
  }
  const { user } = caller

  const lastSignInAt = Date.parse(user.last_sign_in_at ?? '')
  const authenticationAge = Date.now() - lastSignInAt

  if (
    !Number.isFinite(lastSignInAt) ||
    authenticationAge < -MAX_CLOCK_SKEW_MS ||
    authenticationAge > RECENT_AUTH_WINDOW_MS
  ) {
    return http.jsonResponse(
      { error: 'Sign in again before deleting your account.' },
      403,
    )
  }

  const adminClient = createStatelessSupabaseClient(
    supabaseUrl,
    supabaseServiceRoleKey,
  )
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(
    user.id,
    false,
  )

  if (deleteError) {
    return http.jsonResponse({ error: 'Unable to delete your account.' }, 500)
  }

  return http.jsonResponse({ deleted: true })
})
