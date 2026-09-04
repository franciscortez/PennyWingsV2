import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { AppError } from '@/lib/errors'
import { fetchDailySpending } from '@/services/reportsService'
import { server } from '../mocks/server'

type TransactionRow = {
  amount: number
  card?: { card_name: string } | null
  category?: { color: string | null; name: string } | null
  description: string | null
  id: string
  transaction_date: string
  wallet?: { wallet_name: string } | null
}

// Captures the outgoing request so the query itself can be asserted, then
// replies with whatever the test needs.
const mockTransactions = (rows: TransactionRow[]) => {
  const requests: URL[] = []

  server.use(
    http.get('*/rest/v1/transactions*', ({ request }) => {
      requests.push(new URL(request.url))
      return HttpResponse.json(rows)
    }),
  )

  return requests
}

const row = (
  id: string,
  transaction_date: string,
  amount: number,
  overrides: Partial<TransactionRow> = {},
): TransactionRow => ({
  amount,
  card: { card_name: 'BDO Debit' },
  category: { color: '#ef4444', name: 'Groceries' },
  description: `Item ${id}`,
  id,
  transaction_date,
  ...overrides,
})

describe('fetchDailySpending', () => {
  // The `expense`-only and user-scoping rules are enforced by PostgREST, not by
  // this client, so feeding the mock mixed rows and asserting they are filtered
  // would prove nothing about our code. Asserting the query does.
  it('asks only for the signed-in user’s expenses inside the month', async () => {
    const requests = mockTransactions([])

    await fetchDailySpending('user-1', '2026-03-01')

    const params = requests[0].searchParams

    expect(params.get('type')).toBe('eq.expense')
    expect(params.get('user_id')).toBe('eq.user-1')
    expect(params.getAll('transaction_date')).toEqual([
      'gte.2026-03-01',
      'lt.2026-04-01',
    ])
  })

  it('rolls the upper bound into the next year in December', async () => {
    const requests = mockTransactions([])

    await fetchDailySpending('user-1', '2026-12-01')

    expect(requests[0].searchParams.getAll('transaction_date')).toEqual([
      'gte.2026-12-01',
      'lt.2027-01-01',
    ])
  })

  it('accepts a bare YYYY-MM as well as a full date', async () => {
    const requests = mockTransactions([])

    await fetchDailySpending('user-1', '2026-03')

    expect(requests[0].searchParams.getAll('transaction_date')).toEqual([
      'gte.2026-03-01',
      'lt.2026-04-01',
    ])
  })

  it('maps rows into a calendar, folding a day into one entry', async () => {
    mockTransactions([
      row('a', '2026-03-14', 640),
      row('b', '2026-03-14', 600),
      row('c', '2026-03-02', 300),
    ])

    const calendar = await fetchDailySpending('user-1', '2026-03-01')

    expect(calendar.month).toBe('2026-03-01')
    expect(calendar.totalSpent).toBe(1540)
    expect(calendar.maxDailyTotal).toBe(1240)
    expect(calendar.days).toHaveLength(2)
    // Sorted ascending by date, not by the order the rows arrived.
    expect(calendar.days[0]).toMatchObject({
      date: '2026-03-02',
      total: 300,
      transactionCount: 1,
    })
    expect(calendar.days[1]).toMatchObject({
      date: '2026-03-14',
      total: 1240,
      transactionCount: 2,
    })
  })

  it('flattens the category and account relations onto each transaction', async () => {
    mockTransactions([row('a', '2026-03-14', 640)])

    const { days } = await fetchDailySpending('user-1', '2026-03-01')

    expect(days[0].transactions[0]).toEqual({
      accountName: 'BDO Debit',
      amount: 640,
      categoryColor: '#ef4444',
      categoryName: 'Groceries',
      description: 'Item a',
      id: 'a',
    })
  })

  it('falls back to the wallet name when the row has no card', async () => {
    mockTransactions([
      row('a', '2026-03-14', 640, {
        card: null,
        wallet: { wallet_name: 'GCash' },
      }),
    ])

    const { days } = await fetchDailySpending('user-1', '2026-03-01')

    expect(days[0].transactions[0].accountName).toBe('GCash')
  })

  it('keeps a row whose category and account are both missing', async () => {
    mockTransactions([
      row('a', '2026-03-14', 640, { card: null, category: null, description: null }),
    ])

    const { days } = await fetchDailySpending('user-1', '2026-03-01')

    expect(days[0].transactions[0]).toMatchObject({
      accountName: null,
      categoryColor: null,
      categoryName: null,
      description: null,
    })
  })

  it('reports an empty month as zeros rather than NaN or -Infinity', async () => {
    mockTransactions([])

    const calendar = await fetchDailySpending('user-1', '2026-03-01')

    expect(calendar).toEqual({
      days: [],
      maxDailyTotal: 0,
      month: '2026-03-01',
      totalSpent: 0,
    })
  })

  it('surfaces a failed request as an AppError', async () => {
    server.use(
      http.get('*/rest/v1/transactions*', () =>
        HttpResponse.json(
          { message: 'permission denied for table transactions' },
          { status: 403 },
        ),
      ),
    )

    await expect(fetchDailySpending('user-1', '2026-03-01')).rejects.toBeInstanceOf(
      AppError,
    )
  })
})
