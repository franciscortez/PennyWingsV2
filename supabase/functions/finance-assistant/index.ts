import {
  MAX_REQUEST_BYTES,
  OPENROUTER_TIMEOUT_MS,
  getFreeModel,
  getSafeProviderStatus,
  openRouterResponseSchema,
  requestSchema,
  toDateValue,
} from './helpers.ts'
import { generateCurrentUserMessage, systemPrompt } from './prompt.ts'
import { buildFinancialContext } from './context.ts'
import {
  createFunctionHttpContext,
  guardFunctionRequest,
} from '../_shared/http.ts'
import { getEnv, serve } from '../_shared/runtime.ts'
import {
  getAuthenticatedCaller,
  getBearerAuthorization,
} from '../_shared/supabase.ts'

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
  const openRouterKey = getEnv('OPENROUTER_API_KEY')

  if (!supabaseUrl || !supabaseAnonKey || !openRouterKey) {
    return http.jsonResponse({ error: 'The AI assistant is not configured.' }, 503)
  }

  const rawBody = await request.text()
  if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
    return http.jsonResponse({ error: 'The conversation is too long.' }, 413)
  }

  let parsedBody: unknown
  try {
    parsedBody = JSON.parse(rawBody)
  } catch {
    return http.jsonResponse({ error: 'Invalid request.' }, 400)
  }

  const input = requestSchema.safeParse(parsedBody)
  if (!input.success) {
    return http.jsonResponse({ error: 'Invalid assistant request.' }, 400)
  }

  const caller = await getAuthenticatedCaller(
    supabaseUrl,
    supabaseAnonKey,
    authorization,
  )

  if (!caller.user || !caller.client) {
    return http.jsonResponse({ error: 'Your session has expired.' }, 401)
  }
  const { client: supabase, user } = caller

  const now = new Date()
  const today = toDateValue(now)
  const monthStart = toDateValue(
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
  )
  const yearStart = toDateValue(new Date(Date.UTC(now.getUTCFullYear(), 0, 1)))

  const [
    profileResult,
    cardsResult,
    walletsResult,
    membershipsResult,
    monthTransactionsResult,
    recentTransactionsResult,
    budgetsResult,
    budgetExpensesResult,
    goalsResult,
    reportsResult,
  ] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
    supabase
      .from('bank_cards')
      .select('id, card_name, card_type, balance, user_id')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('e_wallets')
      .select('id, wallet_name, wallet_type, balance, user_id')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('account_memberships')
      .select('resource_id, resource_type, role')
      .eq('user_id', user.id)
      .limit(200),
    supabase
      .from('transactions')
      .select('amount, type')
      .gte('transaction_date', monthStart)
      .limit(1_000),
    supabase
      .from('transactions')
      .select(`
        amount, description, payment_method, transaction_date, type,
        category:categories(name),
        card:bank_cards!transactions_card_id_fkey(card_name),
        wallet:e_wallets!transactions_wallet_id_fkey(wallet_name),
        to_card:bank_cards!transactions_to_card_id_fkey(card_name),
        to_wallet:e_wallets!transactions_to_wallet_id_fkey(wallet_name)
      `)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('budgets')
      .select('category_id, limit_amount, period, category:categories(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('transactions')
      .select('amount, category_id, transaction_date')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('transaction_date', yearStart)
      .limit(1_000),
    supabase
      .from('goals')
      .select(`
        name, target_amount, current_amount, target_date,
        linked_card_id, linked_wallet_id,
        linked_card:bank_cards!goals_linked_card_id_fkey(balance),
        linked_wallet:e_wallets!goals_linked_wallet_id_fkey(balance)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('monthly_reports')
      .select(`
        report_month, income_total, expense_total, withdrawal_total,
        transfer_total, net_cashflow, transaction_count
      `)
      .eq('user_id', user.id)
      .order('report_month', { ascending: false })
      .limit(6),
  ])

  const dataError =
    profileResult.error ??
    cardsResult.error ??
    walletsResult.error ??
    membershipsResult.error ??
    monthTransactionsResult.error ??
    recentTransactionsResult.error ??
    budgetsResult.error ??
    budgetExpensesResult.error ??
    goalsResult.error ??
    reportsResult.error

  if (dataError) {
    return http.jsonResponse({ error: 'Unable to prepare your financial context.' }, 500)
  }

  const context = buildFinancialContext({
    user,
    now,
    today,
    monthStart,
    profile: profileResult.data,
    cards: cardsResult.data,
    wallets: walletsResult.data,
    memberships: membershipsResult.data,
    monthTransactions: monthTransactionsResult.data,
    recentTransactions: recentTransactionsResult.data,
    budgets: budgetsResult.data,
    budgetExpenses: budgetExpensesResult.data,
    goals: goalsResult.data,
    reports: reportsResult.data,
  })

  const currentUserMessage = generateCurrentUserMessage(context, input.data.question)

  const openRouterHeaders: Record<string, string> = {
    Authorization: `Bearer ${openRouterKey}`,
    'Content-Type': 'application/json',
  }
  const siteUrl = getEnv('OPENROUTER_SITE_URL')
  const siteName = getEnv('OPENROUTER_SITE_NAME')
  if (siteUrl) openRouterHeaders['HTTP-Referer'] = siteUrl
  if (siteName) openRouterHeaders['X-OpenRouter-Title'] = siteName

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS)

  try {
    const providerResponse = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...input.data.messages,
            { role: 'user', content: currentUserMessage },
          ],
          model: getFreeModel(getEnv('OPENROUTER_MODEL')),
          temperature: 0.4,
        }),
        headers: openRouterHeaders,
        method: 'POST',
        signal: controller.signal,
      },
    )

    if (!providerResponse.ok) {
      return http.jsonResponse(
        { error: 'The AI provider could not complete the request.' },
        getSafeProviderStatus(providerResponse.status),
      )
    }

    const providerData = openRouterResponseSchema.safeParse(
      await providerResponse.json(),
    )
    if (!providerData.success) {
      return http.jsonResponse({ error: 'The AI provider returned an invalid response.' }, 502)
    }

    return http.jsonResponse({
      message: providerData.data.choices[0].message.content,
      model: providerData.data.model,
    })
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'AbortError'
    return http.jsonResponse(
      { error: timedOut ? 'The AI provider timed out.' : 'The AI provider is unavailable.' },
      503,
    )
  } finally {
    clearTimeout(timeout)
  }
})
