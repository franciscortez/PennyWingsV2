import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'

import { fetchDashboardData } from '@/services/dashboardService'
import { fetchDebtPayments, fetchDebts, payDebt, reverseDebtPayment } from '@/services/debtsService'
import { fetchDailySpending } from '@/services/reportsService'
import { fetchTransactions } from '@/services/transactionsService'
import { createDebtReportingFixture } from '../helpers/debtReportingFixture'
import { server } from '../mocks/server'

describe('debt repayment expenses', () => {
  let fixture: ReturnType<typeof createDebtReportingFixture>

  beforeEach(() => {
    fixture = createDebtReportingFixture()
    server.use(http.all('*/rest/v1/*', async ({ request }) => {
      const args = request.method === 'POST' ? await request.json() as Record<string, unknown> : {}
      const reply = fixture.respond(request.method, request.url, args)
      return request.method === 'HEAD'
        ? new HttpResponse(null, { status: reply.status, headers: reply.headers })
        : new HttpResponse(JSON.stringify(reply.body), {
          status: reply.status, headers: { ...reply.headers, 'content-type': 'application/json' },
        })
    }))
  })

  async function assertReporting(balance: number, goalProgress: number, expenses = 100, repaymentIds: string[] = []) {
    const [dashboard, list, calendar] = await Promise.all([
      fetchDashboardData('test-user-id'),
      fetchTransactions({ page: 1, pageSize: 10, search: '', type: 'all', userId: 'test-user-id' }),
      fetchDailySpending('test-user-id', fixture.date),
    ])
    expect(dashboard.totalBalance).toBe(balance)
    expect(dashboard.monthlyStats).toEqual({ income: 2000, expenses })
    expect(dashboard.progress).toEqual({ budget: 10, goals: goalProgress })
    const allIds = [...repaymentIds, 'tx-1', 'tx-2'].sort()
    expect(dashboard.transactions.map(row => row.id).sort()).toEqual(allIds)
    expect(list.totalCount).toBe(allIds.length)
    expect(list.totalPages).toBe(1)
    expect(list.transactions.map(row => row.id).sort()).toEqual(allIds)
    for (const id of repaymentIds) {
      expect(list.transactions.find(row => row.id === id)?.debt_payment_id).toBeTruthy()
    }
    expect(calendar.totalSpent).toBe(expenses)
    expect(calendar.days).toHaveLength(1)
    expect(calendar.days[0]).toMatchObject({ total: expenses, transactionCount: repaymentIds.length + 1 })
    expect(calendar.days[0].transactions.map(row => row.id).sort()).toEqual([...repaymentIds, 'tx-2'].sort())
    expect(fixture.unexpectedRequests).toEqual([])
  }

  it('records partial/full repayments as expenses and removes reversed payments without double deductions', async () => {
    await assertReporting(5000, 50)
    const first = await payDebt({
      debt_id: 'debt-1', amount: 1000, payment_method: 'card', card_id: 'card-1',
      payment_date: fixture.date, note: 'Separate debt installment',
    })
    expect(first).toMatchObject({ remaining_balance: 2000, is_paid: false })
    expect(await fetchDebts()).toEqual([expect.objectContaining({ outstandingAmount: 2000, status: 'outstanding' })])
    expect(await fetchDebtPayments('debt-1')).toEqual([
      expect.objectContaining({ amount: 1000, status: 'completed', note: 'Separate debt installment' }),
    ])
    await assertReporting(4000, 40, 1100, ['repayment-tx-1'])

    const final = await payDebt({
      debt_id: 'debt-1', amount: 2000, payment_method: 'card', card_id: 'card-1', payment_date: fixture.date,
    })
    expect(final).toMatchObject({ remaining_balance: 0, is_paid: true })
    expect(await fetchDebts()).toEqual([expect.objectContaining({ outstandingAmount: 0, status: 'paid' })])
    expect(await fetchDebtPayments('debt-1')).toHaveLength(2)
    await assertReporting(2000, 20, 3100, ['repayment-tx-1', 'repayment-tx-2'])

    await reverseDebtPayment(final.id, 'Incorrect final installment')
    expect(await fetchDebts()).toEqual([expect.objectContaining({ outstandingAmount: 2000, status: 'outstanding' })])
    expect(await fetchDebtPayments('debt-1')).toEqual([
      expect.objectContaining({ id: final.id, amount: 2000, status: 'reversed', reversalReason: 'Incorrect final installment' }),
      expect.objectContaining({ id: first.id, amount: 1000, status: 'completed' }),
    ])
    await assertReporting(4000, 40, 1100, ['repayment-tx-1'])
    expect(fixture.rpcCalls.map(call => call.name)).toEqual([
      'pay_debt_checked', 'pay_debt_checked', 'reverse_debt_payment_checked',
    ])
  })

  it('leaves reporting and history unchanged when an overpayment is rejected', async () => {
    await expect(payDebt({
      debt_id: 'debt-1', amount: 3500, payment_method: 'card', card_id: 'card-1',
    })).rejects.toThrow('Payment amount exceeds remaining debt balance.')
    expect(await fetchDebtPayments('debt-1')).toEqual([])
    expect(await fetchDebts()).toEqual([expect.objectContaining({ outstandingAmount: 3000 })])
    await assertReporting(5000, 50)
  })

  it('leaves reporting and history unchanged when funds are insufficient', async () => {
    fixture = createDebtReportingFixture(500)
    await expect(payDebt({
      debt_id: 'debt-1', amount: 1000, payment_method: 'card', card_id: 'card-1',
    })).rejects.toThrow('Insufficient balance in selected account.')
    expect(await fetchDebtPayments('debt-1')).toEqual([])
    expect(await fetchDebts()).toEqual([expect.objectContaining({ outstandingAmount: 3000 })])
    await assertReporting(500, 5)
  })
})
