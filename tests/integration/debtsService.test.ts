import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import {
  addDebtCharge,
  archiveDebt,
  createDebt,
  fetchDebtById,
  fetchDebtCharges,
  voidDebtCharge,
  fetchDebtPayments,
  fetchDebts,
  payDebt,
  reverseDebtPayment,
  unarchiveDebt,
  updateDebt,
} from '@/services/debtsService'

import { server } from '../mocks/server'

describe('debtsService', () => {
  it('fetches debts list and maps fields correctly', async () => {
    const debts = await fetchDebts()
    expect(debts).toHaveLength(2)

    const atome = debts.find((d) => d.providerName === 'Atome')
    expect(atome).toBeDefined()
    expect(atome?.originalAmount).toBe(3000)
    expect(atome?.outstandingAmount).toBe(1500)
    expect(atome?.status).toBe('outstanding')

    const singleDebt = await fetchDebtById('debt-1')
    expect(singleDebt.id).toBe('debt-1')
  })

  it('fetches debt payments with mapped relations', async () => {
    const payments = await fetchDebtPayments('debt-1')
    expect(payments).toHaveLength(1)
    expect(payments[0].amount).toBe(1500)
    expect(payments[0].accountName).toBe('Main Debit')
    expect(payments[0].status).toBe('completed')
  })

  it('fetches debt charges and maps fields correctly', async () => {
    const charges = await fetchDebtCharges('debt-1')
    expect(charges).toHaveLength(2)
    expect(charges[0]).toMatchObject({
      amount: 50,
      chargeDate: '2026-10-05',
      debtId: 'debt-1',
      status: 'active',
    })
    expect(charges.reduce((sum, c) => sum + c.amount, 0)).toBe(70)
  })

  it('adds a purchase via checked RPC and returns the new balance', async () => {
    const result = await addDebtCharge({
      amount: 50,
      charge_date: '2026-10-05',
      debt_id: 'debt-1',
      note: 'Second purchase',
    })
    expect(result.id).toBe('charge-new-1')
    expect(result.outstanding_amount).toBe(70)
  })

  it('sends the local day when no charge or payment date is given', async () => {
    const originalTimeZone = process.env.TZ
    const bodies: Record<string, unknown>[] = []
    process.env.TZ = 'Asia/Manila'
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-03T16:30:00Z')) // 00:30 on 4 Oct in Manila

    server.use(
      http.post('*/rest/v1/rpc/add_debt_charge_checked', async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>)

        return HttpResponse.json({ id: 'charge-new-1', debt_id: 'debt-1', amount: 50, outstanding_amount: 70 })
      }),
      http.post('*/rest/v1/rpc/pay_debt_checked', async ({ request }) => {
        bodies.push((await request.json()) as Record<string, unknown>)

        return HttpResponse.json({ id: 'payment-new-1', debt_id: 'debt-1', amount: 1, remaining_balance: 0, is_paid: true })
      }),
    )

    try {
      await addDebtCharge({ amount: 50, debt_id: 'debt-1', note: null })
      await payDebt({ amount: 1, debt_id: 'debt-1', payment_method: 'card', card_id: 'card-1' })
    } finally {
      vi.useRealTimers()

      if (originalTimeZone === undefined) {
        delete process.env.TZ
      } else {
        process.env.TZ = originalTimeZone
      }
    }

    expect(bodies[0]).toMatchObject({ p_charge_date: '2026-10-04' })
    expect(bodies[1]).toMatchObject({ p_payment_date: '2026-10-04' })
  })

  it('voids a purchase via checked RPC', async () => {
    await expect(voidDebtCharge('charge-2', 'Cancelled order')).resolves.toBeUndefined()
  })

  it('creates debt via checked RPC', async () => {
    const result = await createDebt({
      provider_name: 'Billease',
      debt_type: 'bnpl',
      original_amount: 4000,
      due_date: '2026-11-15',
      note: 'Electronics',
    })
    expect(result.id).toBe('debt-new-1')
  })

  it('pays debt via checked RPC and returns balance', async () => {
    const result = await payDebt({
      debt_id: 'debt-1',
      amount: 1500,
      payment_method: 'card',
      card_id: 'card-1',
    })
    expect(result.id).toBe('payment-new-1')
    expect(result.remaining_balance).toBe(0)
    expect(result.is_paid).toBe(true)
  })

  it('updates, archives, unarchives, and reverses payments without throwing', async () => {
    await expect(
      updateDebt('debt-1', {
        provider_name: 'Atome Updated',
        debt_type: 'bnpl',
      }),
    ).resolves.toBeUndefined()

    await expect(archiveDebt('debt-1')).resolves.toBeUndefined()
    await expect(unarchiveDebt('debt-1')).resolves.toBeUndefined()
    await expect(
      reverseDebtPayment('payment-1', 'Incorrect amount'),
    ).resolves.toBeUndefined()
  })
})
