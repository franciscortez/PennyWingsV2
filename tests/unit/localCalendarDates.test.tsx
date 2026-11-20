import { render, renderHook, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDebtsData } from '@/hooks/useDebtsData'
import { addDays, daysUntil, toDateInputValue } from '@/lib/date'
import { AddChargeModal } from '@/sections/debts/AddChargeModal'
import { DebtCard } from '@/sections/debts/DebtCard'
import { PayDebtModal } from '@/sections/debts/PayDebtModal'
import { fetchDebts } from '@/services/debtsService'
import type { Debt } from '@/types'

vi.mock('@/services/debtsService', () => ({
  addDebtCharge: vi.fn(),
  archiveDebt: vi.fn(),
  createDebt: vi.fn(),
  fetchDebtCharges: vi.fn().mockResolvedValue([]),
  fetchDebtPayments: vi.fn().mockResolvedValue([]),
  fetchDebts: vi.fn().mockResolvedValue([]),
  payDebt: vi.fn(),
  reverseDebtPayment: vi.fn(),
  unarchiveDebt: vi.fn(),
  updateDebt: vi.fn(),
  voidDebtCharge: vi.fn(),
}))

const originalTimeZone = process.env.TZ

const useTimeZone = (timeZone: string) => {
  process.env.TZ = timeZone
}

const baseDebt: Debt = {
  id: 'debt-1',
  userId: 'user-1',
  providerName: 'Atome',
  debtType: 'bnpl',
  originalAmount: 5000,
  outstandingAmount: 2000,
  dueDate: null,
  note: null,
  status: 'outstanding',
  paidAt: null,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
}

afterEach(() => {
  vi.useRealTimers()

  if (originalTimeZone === undefined) {
    delete process.env.TZ
  } else {
    process.env.TZ = originalTimeZone
  }
})

// 00:30 on 4 Oct in Manila (UTC+8) is still 3 Oct in UTC. A UTC slice of the
// clock therefore yields yesterday for the first eight hours of every local day.
describe('local calendar date at 00:30 in UTC+8', () => {
  beforeEach(() => {
    useTimeZone('Asia/Manila')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-03T16:30:00Z'))
  })

  it('reports the local day for today and day arithmetic', () => {
    expect(toDateInputValue()).toBe('2026-10-04')
    expect(toDateInputValue(addDays(new Date(), 3))).toBe('2026-10-07')
    expect(daysUntil('2026-10-04')).toBe(0)
    expect(daysUntil('2026-10-07')).toBe(3)
    expect(daysUntil('2026-10-03')).toBe(-1)
    expect(daysUntil(null)).toBeNull()
  })

  it('defaults the payment date to the local day', () => {
    render(
      <PayDebtModal accounts={[]} debt={baseDebt} onClose={vi.fn()} onSubmit={vi.fn()} saving={false} />,
    )

    expect(screen.getByLabelText('Payment Date')).toHaveValue('2026-10-04')
  })

  it('submits the purchase with the local day as the default charge date', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(true)
    render(<AddChargeModal debt={baseDebt} onClose={vi.fn()} onSubmit={onSubmit} saving={false} />)

    await user.type(screen.getByLabelText(/Purchase Amount/i), '50')
    await user.click(screen.getByRole('button', { name: 'Add Purchase' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ charge_date: '2026-10-04' }))
  })

  it('counts due-today as due soon and yesterday as overdue', async () => {
    vi.mocked(fetchDebts).mockResolvedValue([
      { ...baseDebt, id: 'due-today', dueDate: '2026-10-04' },
      { ...baseDebt, id: 'due-yesterday', dueDate: '2026-10-03' },
      { ...baseDebt, id: 'due-in-3', dueDate: '2026-10-07' },
      { ...baseDebt, id: 'due-in-4', dueDate: '2026-10-08' },
    ])
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useDebtsData('user-1'), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.overdueCount).toBe(1)
    expect(result.current.dueSoonCount).toBe(2)
  })
})

// A date-only string parses as UTC midnight, which is the previous local day
// west of UTC. The card must compare calendar days, not instants.
describe('debt card due date west of UTC', () => {
  beforeEach(() => {
    useTimeZone('America/New_York')
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-04T16:00:00Z'))
  })

  it('shows a debt due today as due today and formats the due date on the right day', () => {
    const { rerender } = render(
      <DebtCard debt={{ ...baseDebt, dueDate: '2026-10-04' }} onPay={vi.fn()} onHistory={vi.fn()} />,
    )

    expect(screen.getByText('Due today')).toBeInTheDocument()

    rerender(<DebtCard debt={{ ...baseDebt, dueDate: '2026-10-20' }} onPay={vi.fn()} onHistory={vi.fn()} />)

    expect(screen.getByText('Due Oct 20, 2026')).toBeInTheDocument()
  })
})
