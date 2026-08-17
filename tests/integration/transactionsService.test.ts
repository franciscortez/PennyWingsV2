import { describe, expect, it, vi } from 'vitest'
import { supabase } from '@/lib/supabase'
import {
  deleteTransaction,
  fetchTransactions,
  processTransaction,
  updateTransaction,
} from '@/services/transactionsService'

describe('transactionsService integration', () => {
  it('calls process_transaction_checked RPC with correct parameters', async () => {
    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
      data: null,
      error: null,
    } as never)

    await processTransaction({
      amount: 100,
      card_id: 'card-1',
      category_id: 'cat-1',
      description: 'Lunch',
      fee_amount: 5,
      payment_method: 'card',
      to_card_id: null,
      to_wallet_id: null,
      transaction_date: '2026-08-17',
      type: 'expense',
      wallet_id: null,
    })

    expect(rpcSpy).toHaveBeenCalledWith(
      'process_transaction_checked',
      expect.objectContaining({
        p_amount: 100,
        p_card_id: 'card-1',
        p_category_id: 'cat-1',
        p_fee_amount: 5,
        p_type: 'expense',
      }),
    )

    rpcSpy.mockRestore()
  })

  it('calls delete_transaction RPC with transaction ID', async () => {
    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
      data: null,
      error: null,
    } as never)

    await deleteTransaction('tx-delete-123')

    expect(rpcSpy).toHaveBeenCalledWith('delete_transaction', {
      p_id: 'tx-delete-123',
    })

    rpcSpy.mockRestore()
  })

  it('calls update_transaction_checked RPC with updated values', async () => {
    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
      data: null,
      error: null,
    } as never)

    await updateTransaction('tx-456', {
      amount: 250,
      card_id: 'card-1',
      category_id: 'cat-2',
      description: 'Groceries update',
      fee_amount: 0,
      payment_method: 'card',
      to_card_id: null,
      to_wallet_id: null,
      transaction_date: '2026-08-17',
      type: 'expense',
      wallet_id: null,
    })

    expect(rpcSpy).toHaveBeenCalledWith(
      'update_transaction_checked',
      expect.objectContaining({
        p_id: 'tx-456',
        p_amount: 250,
      }),
    )

    rpcSpy.mockRestore()
  })

  it('fetchTransactions requests paginated data and returns formatted transactions', async () => {
    const result = await fetchTransactions({
      page: 1,
      pageSize: 10,
      search: '',
      type: 'all',
      userId: 'test-user-id',
    })

    expect(result).toBeDefined()
    expect(result.transactions).toBeInstanceOf(Array)
    if (result.transactions.length > 0) {
      expect(result.transactions[0]).toHaveProperty('amount')
      expect(result.transactions[0]).toHaveProperty('type')
    }
  })
})
