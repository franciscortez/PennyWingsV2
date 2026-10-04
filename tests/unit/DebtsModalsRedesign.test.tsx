import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AddDebtModal } from '@/sections/debts/AddDebtModal'
import { EditDebtModal } from '@/sections/debts/EditDebtModal'
import type { Debt } from '@/types'

const mockDebt: Debt = {
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
}

describe('Debts Modals Redesign', () => {
  describe('AddDebtModal', () => {
    it('applies appModalPanel container styling and starts with blank amount', () => {
      render(
        <AddDebtModal
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          saving={false}
        />,
      )

      const dialog = screen.getByRole('dialog', { name: /Add New Debt/i })
      expect(dialog).toHaveClass('app-design-modal')
      expect(dialog).toHaveClass('max-w-lg')

      const amountInput = screen.getByLabelText(/Total Amount/i)
      expect(amountInput).toHaveValue(null)
      expect(amountInput).toHaveAttribute('placeholder', '0.00')
    })

    it('allows toggling debt type pill choices and using provider suggestion chips', async () => {
      const user = userEvent.setup()
      render(
        <AddDebtModal
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          saving={false}
        />,
      )

      // Test suggestion chip click
      const atomeSuggestion = screen.getByRole('button', { name: /Use Atome as provider/i })
      await user.click(atomeSuggestion)
      expect(screen.getByLabelText(/Provider or Creditor Name/i)).toHaveValue('Atome')

      // Test pill choice
      const creditCardPill = screen.getByRole('radio', { name: /Credit Card/i })
      expect(creditCardPill).toHaveAttribute('aria-checked', 'false')

      await user.click(creditCardPill)
      expect(creditCardPill).toHaveAttribute('aria-checked', 'true')
    })
  })

  describe('EditDebtModal', () => {
    it('applies appModalPanel container styling and renders active pill choice', () => {
      render(
        <EditDebtModal
          debt={mockDebt}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          saving={false}
        />,
      )

      const dialog = screen.getByRole('dialog', { name: /Edit Atome BNPL/i })
      expect(dialog).toHaveClass('app-design-modal')
      expect(dialog).toHaveClass('max-w-lg')

      const bnplPill = screen.getByRole('radio', { name: /BNPL/i })
      expect(bnplPill).toHaveAttribute('aria-checked', 'true')
    })
  })
})
