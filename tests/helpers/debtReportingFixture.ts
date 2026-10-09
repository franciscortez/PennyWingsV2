import type { Tables } from '../../src/lib/database.types'

type PaymentRow = Tables<'debt_payments'> & { card: { card_name: string } }
type FixtureReply = { status: number; body: unknown; headers?: Record<string, string> }

/** Stateful HTTP fixture shared by service and browser regression tests.
 * It models the external RPC boundary; SQL tests exercise the actual RPCs.
 */
export function createDebtReportingFixture(balance = 5000) {
  const now = new Date()
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const timestamp = `${date}T08:00:00Z`
  const card = {
    id: 'card-1', user_id: 'test-user-id', card_name: 'BDO Debit',
    card_type: 'debit', last_four: '1234', balance, is_active: true,
    status: 'active', color: '#1e3a8a', text_color: '#ffffff', created_at: timestamp,
  }
  const debt: Tables<'debts'> = {
    id: 'debt-1', user_id: 'test-user-id', provider_name: 'Atome', debt_type: 'bnpl',
    original_amount: 3000, outstanding_amount: 3000, due_date: null, note: null,
    status: 'outstanding', paid_at: null, created_at: timestamp, updated_at: timestamp,
  }
  const categories = [
    { id: 'cat-1', name: 'Salary', type: 'income', icon: 'wallet', color: '#10b981' },
    { id: 'cat-2', name: 'Groceries', type: 'expense', icon: 'utensils', color: '#ef4444' },
  ]
  const repaymentCategory = { id: 'cat-debt', name: 'Debt Repayment', type: 'expense', icon: 'credit-card', color: '#f43f5e' }
  const transactions = categories.map((category, index) => ({
    id: `tx-${index + 1}`, user_id: 'test-user-id', created_by: 'test-user-id',
    type: category.type, payment_method: 'card', amount: index === 0 ? 2000 : 100,
    fee_amount: 0, description: index === 0 ? 'Salary' : 'Ordinary groceries',
    transaction_date: date, created_at: timestamp, card_id: card.id, wallet_id: null,
    to_card_id: null, to_wallet_id: null, category_id: category.id, category,
    debt_payment_id: null as string | null,
    card: { card_name: card.card_name, color: card.color }, wallet: null,
    to_card: null, to_wallet: null,
  }))
  const payments: PaymentRow[] = []
  const unexpectedRequests: string[] = []
  const rpcCalls: { name: string; args: Record<string, unknown> }[] = []

  const error = (code: string, message: string): FixtureReply => ({
    status: 400, body: { code, message },
  })

  function respond(method: string, rawUrl: string, args: Record<string, unknown> = {}): FixtureReply {
    const url = new URL(rawUrl)
    const resource = url.pathname.split('/rest/v1/')[1]
    if (method === 'POST' && resource?.startsWith('rpc/')) {
      const name = resource.slice(4)
      rpcCalls.push({ name, args })
      if (name === 'pay_debt_checked') {
        if (args.p_debt_id !== debt.id || args.p_card_id !== card.id ||
          args.p_payment_method !== 'card' || args.p_wallet_id != null) {
          return error('22023', 'Invalid repayment source.')
        }
        const amount = Number(args.p_amount)
        if (!Number.isFinite(amount) || amount <= 0) {
          return error('22023', 'Payment amount must be greater than zero.')
        }
        if (amount > debt.outstanding_amount) {
          return error('22023', 'Payment amount exceeds remaining debt balance.')
        }
        if (amount > card.balance) return error('P0001', 'Insufficient balance.')
        card.balance -= amount
        debt.outstanding_amount -= amount
        debt.status = debt.outstanding_amount === 0 ? 'paid' : 'outstanding'
        debt.paid_at = debt.status === 'paid' ? timestamp : null
        const id = `payment-${payments.length + 1}`
        payments.unshift({
          id, debt_id: debt.id, user_id: debt.user_id, amount,
          payment_method: 'card', card_id: card.id, wallet_id: null,
          payment_date: String(args.p_payment_date ?? date),
          note: args.p_note == null ? null : String(args.p_note), status: 'completed',
          reversed_at: null, reversal_reason: null, created_at: timestamp,
          card: { card_name: card.card_name },
        })
        transactions.unshift({
          id: `repayment-tx-${payments.length}`, user_id: debt.user_id, created_by: debt.user_id,
          type: 'expense', payment_method: 'card', amount, fee_amount: 0,
          description: `Debt repayment: Atome${args.p_note ? ` — ${args.p_note}` : ''}`,
          transaction_date: String(args.p_payment_date ?? date), created_at: timestamp,
          card_id: card.id, wallet_id: null, to_card_id: null, to_wallet_id: null,
          category_id: repaymentCategory.id, category: repaymentCategory,
          card: { card_name: card.card_name, color: card.color }, wallet: null,
          to_card: null, to_wallet: null, debt_payment_id: id,
        })
        return { status: 200, body: { id, remaining_balance: debt.outstanding_amount, is_paid: debt.status === 'paid' } }
      }
      if (name === 'reverse_debt_payment_checked') {
        const payment = payments.find(row => row.id === args.p_payment_id)
        if (!payment || payment.status !== 'completed') return error('22023', 'Invalid reversal.')
        card.balance += payment.amount
        debt.outstanding_amount += payment.amount
        debt.status = 'outstanding'
        debt.paid_at = null
        payment.status = 'reversed'
        payment.reversed_at = timestamp
        payment.reversal_reason = String(args.p_reason ?? '') || null
        const transactionIndex = transactions.findIndex(row => row.debt_payment_id === payment.id)
        if (transactionIndex >= 0) transactions.splice(transactionIndex, 1)
        return { status: 200, body: null }
      }
    }

    if (method === 'GET' || method === 'HEAD') {
      const rows: Record<string, unknown[]> = {
        bank_cards: [card], e_wallets: [], categories: [...categories, repaymentCategory], debts: [debt],
        debt_payments: payments,
        debt_charges: [{
          id: 'charge-1', debt_id: debt.id, user_id: debt.user_id, amount: 3000,
          charge_date: date, note: 'Original purchase', status: 'active',
          voided_at: null, void_reason: null, created_at: timestamp,
        }],
        transactions,
        budgets: [{ user_id: 'test-user-id', category_id: 'cat-2', limit_amount: 1000 }],
        goals: [{ user_id: 'test-user-id', current_amount: 0, target_amount: 10000, linked_card_id: card.id, linked_wallet_id: null }],
        account_memberships: [], joint_account_invites: [],
      }
      if (resource && resource in rows) {
        let result = rows[resource] as Record<string, unknown>[]
        // Honor the filters sent by real services, including expense-only calendar reads.
        for (const [key, filter] of url.searchParams) {
          if (filter.startsWith('eq.')) result = result.filter(row => String(row[key]) === filter.slice(3))
          if (filter.startsWith('gte.')) result = result.filter(row => String(row[key]) >= filter.slice(4))
          if (filter.startsWith('lte.')) result = result.filter(row => String(row[key]) <= filter.slice(4))
          if (filter.startsWith('lt.')) result = result.filter(row => String(row[key]) < filter.slice(3))
          if (filter.startsWith('ilike.')) result = result.filter(row =>
            String(row[key]).toLowerCase().includes(filter.slice(6).replaceAll('%', '').toLowerCase()))
        }
        const count = result.length
        const offset = Number(url.searchParams.get('offset') ?? 0)
        const limit = Number(url.searchParams.get('limit') ?? count)
        result = result.slice(offset, offset + limit)
        return {
          status: 200, body: method === 'HEAD' ? null : result,
          headers: { 'content-range': `${result.length ? `${offset}-${offset + result.length - 1}` : '*'}/${count}` },
        }
      }
    }
    unexpectedRequests.push(`${method} ${resource}`)
    return error('TEST_UNEXPECTED_REQUEST', `Unexpected ${method} ${resource}`)
  }

  return { date, respond, unexpectedRequests, rpcCalls }
}
