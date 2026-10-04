import { describe, expect, it } from 'vitest'
import {
  archiveDebt,
  createDebt,
  fetchDebtById,
  fetchDebtPayments,
  fetchDebts,
  payDebt,
  reverseDebtPayment,
  unarchiveDebt,
  updateDebt,
} from '@/services/debtsService'

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
