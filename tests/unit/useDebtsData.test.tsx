import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebtsData } from '@/hooks/useDebtsData'
import { addDebtCharge, voidDebtCharge } from '@/services/debtsService'
import type { Debt, DebtCharge, DebtPayment } from '@/types'

const mockDebts: Debt[] = [
  {
    id: 'debt-1',
    userId: 'user-1',
    providerName: 'Atome',
    debtType: 'bnpl',
    originalAmount: 10000,
    outstandingAmount: 4000,
    dueDate: '2026-10-01', // overdue (before 2026-10-04)
    note: 'Phone',
    status: 'outstanding',
    paidAt: null,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'debt-2',
    userId: 'user-1',
    providerName: 'SPayLater',
    debtType: 'bnpl',
    originalAmount: 5000,
    outstandingAmount: 2000,
    dueDate: '2026-10-06', // due soon (within 3 days of 2026-10-04)
    note: null,
    status: 'outstanding',
    paidAt: null,
    createdAt: '2026-09-10T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z',
  },
  {
    id: 'debt-3',
    userId: 'user-1',
    providerName: 'BDO Card',
    debtType: 'credit_card',
    originalAmount: 8000,
    outstandingAmount: 0,
    dueDate: null,
    note: null,
    status: 'paid',
    paidAt: '2026-09-20T00:00:00Z',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-09-20T00:00:00Z',
  },
]

const mockPayments: DebtPayment[] = [
  {
    id: 'payment-1',
    debtId: 'debt-1',
    userId: 'user-1',
    amount: 6000,
    paymentDate: '2026-09-15',
    paymentMethod: 'card',
    cardId: 'card-1',
    walletId: null,
    note: 'Partial pay',
    status: 'completed',
    reversedAt: null,
    reversalReason: null,
    createdAt: '2026-09-15T00:00:00Z',
  },
]

const mockCharges: DebtCharge[] = [
  {
    id: 'charge-1',
    debtId: 'debt-1',
    userId: 'user-1',
    amount: 10000,
    chargeDate: '2026-09-01',
    note: null,
    status: 'active',
    voidedAt: null,
    voidReason: null,
    createdAt: '2026-09-01T00:00:00Z',
  },
]

vi.mock('@/services/debtsService', () => ({
  addDebtCharge: vi
    .fn()
    .mockResolvedValue({ id: 'charge-new', outstanding_amount: 4050 }),
  archiveDebt: vi.fn().mockResolvedValue(undefined),
  createDebt: vi.fn().mockResolvedValue({ id: 'debt-new' }),
  fetchDebtCharges: vi.fn().mockImplementation(() => Promise.resolve(mockCharges)),
  voidDebtCharge: vi.fn().mockResolvedValue(undefined),
  fetchDebtPayments: vi.fn().mockImplementation(() => Promise.resolve(mockPayments)),
  fetchDebts: vi.fn().mockImplementation(() => Promise.resolve(mockDebts)),
  payDebt: vi.fn().mockResolvedValue({ id: 'payment-new', is_paid: false, remaining_balance: 2000 }),
  reverseDebtPayment: vi.fn().mockResolvedValue(undefined),
  unarchiveDebt: vi.fn().mockResolvedValue(undefined),
  updateDebt: vi.fn().mockResolvedValue(undefined),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

describe('useDebtsData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calculates aggregate debt statistics correctly', async () => {
    const { result } = renderHook(() => useDebtsData('user-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    // Total outstanding: 4000 (debt-1) + 2000 (debt-2) = 6000
    expect(result.current.totalOutstanding).toBe(6000)

    // Total settled: (10000 - 4000) + (5000 - 2000) + 8000 = 6000 + 3000 + 8000 = 17000
    expect(result.current.totalSettled).toBe(17000)

    // Overdue count (due before 2026-10-04): 1
    expect(result.current.overdueCount).toBeGreaterThanOrEqual(1)

    // Debts list
    expect(result.current.debts).toHaveLength(3)
  })

  it('executes addDebt mutation successfully', async () => {
    const { result } = renderHook(() => useDebtsData('user-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    let success = false
    await act(async () => {
      success = await result.current.addDebt({
        provider_name: 'Billease',
        debt_type: 'bnpl',
        original_amount: 3000,
      })
    })

    expect(success).toBe(true)
  })

  it('exposes charges and sends add and void charge mutations', async () => {
    const { result } = renderHook(() => useDebtsData('user-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.charges).toHaveLength(1)

    let added = false
    let voided = false
    await act(async () => {
      added = await result.current.addCharge({
        amount: 50,
        charge_date: '2026-10-05',
        debt_id: 'debt-1',
      })
      voided = await result.current.voidCharge('charge-1', 'Cancelled order')
    })

    expect(added).toBe(true)
    expect(voided).toBe(true)
    expect(addDebtCharge).toHaveBeenCalledWith({
      amount: 50,
      charge_date: '2026-10-05',
      debt_id: 'debt-1',
    })
    expect(voidDebtCharge).toHaveBeenCalledWith('charge-1', 'Cancelled order')
  })

  it('returns false when add charge fails', async () => {
    vi.mocked(addDebtCharge).mockRejectedValueOnce(new Error('Debt not found'))
    const { result } = renderHook(() => useDebtsData('user-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    let success = true
    await act(async () => {
      success = await result.current.addCharge({ amount: 50, debt_id: 'missing' })
    })

    expect(success).toBe(false)
  })

  it('executes payDebt mutation successfully', async () => {
    const { result } = renderHook(() => useDebtsData('user-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.loading).toBe(false))

    let success = false
    await act(async () => {
      success = await result.current.payDebt({
        debt_id: 'debt-1',
        amount: 2000,
        payment_method: 'card',
        card_id: 'card-1',
      })
    })

    expect(success).toBe(true)
  })
})
