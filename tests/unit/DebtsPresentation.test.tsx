import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DebtCard } from '@/sections/debts/DebtCard'
import { DebtsListSection } from '@/sections/debts/DebtsListSection'
import { DebtsSummarySection } from '@/sections/debts/DebtsSummarySection'
import type { Debt } from '@/types'

const mockDebts: Debt[] = [
  {
    id: 'debt-1',
    userId: 'user-1',
    providerName: 'Atome BNPL',
    debtType: 'bnpl',
    originalAmount: 10000,
    outstandingAmount: 4000,
    dueDate: '2026-10-31',
    note: 'Phone installments',
    status: 'outstanding',
    paidAt: null,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
  {
    id: 'debt-2',
    userId: 'user-1',
    providerName: 'SPayLater',
    debtType: 'bnpl',
    originalAmount: 5000,
    outstandingAmount: 0,
    dueDate: null,
    note: null,
    status: 'paid',
    paidAt: '2026-09-15T00:00:00Z',
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-09-15T00:00:00Z',
  },
]

describe('Debts Presentation', () => {
  describe('DebtsSummarySection', () => {
    it('displays formatted monetary figures and due status counts', () => {
      render(
        <DebtsSummarySection
          totalOutstanding={12500}
          totalSettled={25000}
          overdueCount={1}
          dueSoonCount={2}
        />,
      )

      expect(screen.getByText('Total Outstanding')).toBeInTheDocument()
      expect(screen.getByText(/12,500/)).toBeInTheDocument()
      expect(screen.getByText(/25,000/)).toBeInTheDocument()
      expect(screen.getByText(/1 Overdue/i)).toBeInTheDocument()
      expect(screen.getByText(/2 Due Soon/i)).toBeInTheDocument()
    })
  })

  describe('DebtCard', () => {
    it('renders provider name, debt type, progress, and pay button', () => {
      const onPay = vi.fn()
      const onHistory = vi.fn()

      render(
        <DebtCard
          debt={mockDebts[0]}
          onPay={onPay}
          onHistory={onHistory}
        />,
      )

      expect(screen.getByText('Atome BNPL')).toBeInTheDocument()
      expect(screen.getByText('Buy Now Pay Later')).toBeInTheDocument()
      expect(screen.getByText('60% paid')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Pay' })).toBeInTheDocument()
    })
  })

  describe('DebtsListSection', () => {
    it('filters between active and settled tabs', async () => {
      const user = userEvent.setup()

      render(
        <DebtsListSection
          debts={mockDebts}
          onAddDebt={vi.fn()}
          onArchive={vi.fn()}
          onEdit={vi.fn()}
          onHistory={vi.fn()}
          onPay={vi.fn()}
          onUnarchive={vi.fn()}
        />,
      )

      // Active tab shows Atome BNPL
      expect(screen.getByText('Atome BNPL')).toBeInTheDocument()
      expect(screen.queryByText('SPayLater')).not.toBeInTheDocument()

      // Switch to Settled tab
      const settledTab = screen.getByRole('button', { name: /Settled/i })
      await user.click(settledTab)

      expect(screen.queryByText('Atome BNPL')).not.toBeInTheDocument()
      expect(screen.getByText('SPayLater')).toBeInTheDocument()
    })
  })
})
