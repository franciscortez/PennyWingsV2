import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTransactionsData } from '@/hooks/useTransactionsData'
import type { Transaction, TransactionFormValues } from '@/types'

const service = vi.hoisted(() => ({
  fetchAccountBalance: vi.fn(),
  processTransaction: vi.fn(),
  updateTransaction: vi.fn(),
}))

vi.mock('@/services/accountsService', () => ({
  fetchAccounts: vi.fn().mockResolvedValue({ accounts: [] }),
}))
vi.mock('@/services/categoriesService', () => ({
  fetchCategories: vi.fn().mockResolvedValue([]),
}))
vi.mock('@/services/transactionsService', () => ({
  deleteTransaction: vi.fn(),
  emptyTransactionsListData: { totalCount: 0, totalPages: 0, transactions: [] },
  fetchAccountBalance: service.fetchAccountBalance,
  fetchTransactions: vi.fn().mockResolvedValue({ totalCount: 0, totalPages: 0, transactions: [] }),
  processTransaction: service.processTransaction,
  updateTransaction: service.updateTransaction,
}))

const transfer: TransactionFormValues = {
  amount: 40,
  card_id: 'source-card',
  category_id: 'expense-category',
  description: 'Transfer',
  fee_amount: 15,
  payment_method: 'card',
  to_payment_method: 'ewallet',
  to_wallet_id: 'destination-wallet',
  transaction_date: '2026-09-23',
  type: 'transfer',
}

const withdrawal: TransactionFormValues = {
  ...transfer,
  description: 'Withdrawal',
  to_payment_method: undefined,
  to_wallet_id: undefined,
  type: 'withdrawal',
}

const existingTransfer: Transaction = {
  amount: 40,
  card_id: 'source-card',
  category_id: 'expense-category',
  created_by: 'user-1',
  description: 'Transfer',
  fee_amount: 15,
  id: 'transaction-1',
  payment_method: 'card',
  to_card_id: null,
  to_wallet_id: 'destination-wallet',
  transaction_date: '2026-09-23',
  type: 'transfer',
  user_id: 'user-1',
  wallet_id: null,
}

const existingWithdrawal: Transaction = {
  ...existingTransfer,
  description: 'Withdrawal',
  to_wallet_id: null,
  type: 'withdrawal',
}

const renderTransactionsHook = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )

  return renderHook(
    () => useTransactionsData({ page: 1, pageSize: 10, search: '', type: 'all', userId: 'user-1' }),
    { wrapper },
  )
}

describe('useTransactionsData transfer fees', () => {
  beforeEach(() => {
    service.fetchAccountBalance.mockResolvedValue(100)
    service.processTransaction.mockResolvedValue(undefined)
    service.updateTransaction.mockResolvedValue(undefined)
  })

  afterEach(() => vi.clearAllMocks())

  it.each([0, 15, 25, 12.34])('passes fee %s to the create service', async (fee) => {
    const { result } = renderTransactionsHook()

    await act(async () => {
      expect(await result.current.createTransaction({ ...transfer, fee_amount: fee })).toEqual({ error: null })
    })

    expect(service.processTransaction).toHaveBeenCalledWith(expect.objectContaining({
      amount: 40,
      fee_amount: fee,
      to_wallet_id: 'destination-wallet',
      type: 'transfer',
    }))
  })

  it('preserves the fee for an unrelated edit and sends a changed fee', async () => {
    const { result } = renderTransactionsHook()

    await act(async () => {
      expect(await result.current.updateTransaction(existingTransfer, {
        ...transfer,
        description: 'New note',
      })).toEqual({ error: null })
      expect(await result.current.updateTransaction(existingTransfer, {
        ...transfer,
        fee_amount: 25,
      })).toEqual({ error: null })
    })

    expect(service.updateTransaction).toHaveBeenNthCalledWith(1, 'transaction-1', expect.objectContaining({
      description: 'New note', fee_amount: 15,
    }))
    expect(service.updateTransaction).toHaveBeenNthCalledWith(2, 'transaction-1', expect.objectContaining({
      fee_amount: 25,
    }))
  })

  it('sends zero after changing a transfer to another type', async () => {
    const { result } = renderTransactionsHook()

    await act(async () => {
      expect(await result.current.updateTransaction(existingTransfer, {
        ...transfer,
        type: 'expense',
      })).toEqual({ error: null })
    })

    expect(service.updateTransaction).toHaveBeenCalledWith('transaction-1', expect.objectContaining({
      fee_amount: 0, to_wallet_id: null, type: 'expense',
    }))
  })

  it('rejects a transfer when amount plus fee exceeds the source balance', async () => {
    service.fetchAccountBalance.mockResolvedValue(50)
    const { result } = renderTransactionsHook()

    await act(async () => {
      const response = await result.current.createTransaction(transfer)
      expect(response.error?.message).toBe('Insufficient balance.')
    })

    expect(service.processTransaction).not.toHaveBeenCalled()
  })

  it('lets the checked RPC decide at a decimal balance boundary', async () => {
    service.fetchAccountBalance.mockResolvedValue(0.3)
    const { result } = renderTransactionsHook()

    await act(async () => {
      expect(await result.current.createTransaction({
        ...transfer, amount: 0.1, fee_amount: 0.2,
      })).toEqual({ error: null })
    })

    expect(service.processTransaction).toHaveBeenCalledOnce()
  })

  it('returns the checked RPC failure when the balance changes after the pre-check', async () => {
    service.processTransaction.mockRejectedValue(new Error('Insufficient balance.'))
    const { result } = renderTransactionsHook()

    await act(async () => {
      const response = await result.current.createTransaction(transfer)
      expect(response.error?.message).toBe('Insufficient balance.')
    })

    expect(service.processTransaction).toHaveBeenCalledOnce()
  })
})

describe('useTransactionsData withdrawal fees', () => {
  beforeEach(() => {
    service.fetchAccountBalance.mockResolvedValue(100)
    service.processTransaction.mockResolvedValue(undefined)
    service.updateTransaction.mockResolvedValue(undefined)
  })

  afterEach(() => vi.clearAllMocks())

  it.each([0, 15, 25, 12.34])('passes withdrawal fee %s to the create service', async (fee) => {
    const { result } = renderTransactionsHook()

    await act(async () => {
      expect(await result.current.createTransaction({ ...withdrawal, fee_amount: fee })).toEqual({ error: null })
    })

    expect(service.processTransaction).toHaveBeenCalledWith(expect.objectContaining({
      amount: 40,
      fee_amount: fee,
      to_wallet_id: null,
      type: 'withdrawal',
    }))
  })

  it.each(['card', 'ewallet', 'lent'] as const)('supports a %s source', async (method) => {
    const { result } = renderTransactionsHook()

    await act(async () => {
      expect(await result.current.createTransaction({
        ...withdrawal,
        card_id: method === 'card' ? 'source-card' : undefined,
        payment_method: method,
        wallet_id: method === 'card' ? undefined : 'source-wallet',
      })).toEqual({ error: null })
    })

    expect(service.processTransaction).toHaveBeenCalledWith(expect.objectContaining({
      card_id: method === 'card' ? 'source-card' : null,
      fee_amount: 15,
      payment_method: method === 'lent' ? 'ewallet' : method,
      wallet_id: method === 'card' ? null : 'source-wallet',
    }))
  })

  it('preserves the fee for a note edit and sends a changed fee', async () => {
    const { result } = renderTransactionsHook()

    await act(async () => {
      expect(await result.current.updateTransaction(existingWithdrawal, {
        ...withdrawal,
        description: 'New note',
      })).toEqual({ error: null })
      expect(await result.current.updateTransaction(existingWithdrawal, {
        ...withdrawal,
        fee_amount: 25,
      })).toEqual({ error: null })
    })

    expect(service.updateTransaction).toHaveBeenNthCalledWith(1, 'transaction-1', expect.objectContaining({
      description: 'New note', fee_amount: 15,
    }))
    expect(service.updateTransaction).toHaveBeenNthCalledWith(2, 'transaction-1', expect.objectContaining({
      fee_amount: 25,
    }))
  })

  it('sends zero after switching a withdrawal to an expense', async () => {
    const { result } = renderTransactionsHook()

    await act(async () => {
      expect(await result.current.updateTransaction(existingWithdrawal, {
        ...withdrawal, type: 'expense',
      })).toEqual({ error: null })
    })

    expect(service.updateTransaction).toHaveBeenCalledWith('transaction-1', expect.objectContaining({
      fee_amount: 0, type: 'expense',
    }))
  })

  it('rejects a withdrawal when amount plus fee exceeds the source balance', async () => {
    service.fetchAccountBalance.mockResolvedValue(50)
    const { result } = renderTransactionsHook()

    await act(async () => {
      const response = await result.current.createTransaction(withdrawal)
      expect(response.error?.message).toBe('Insufficient balance.')
    })

    expect(service.processTransaction).not.toHaveBeenCalled()
  })
})
