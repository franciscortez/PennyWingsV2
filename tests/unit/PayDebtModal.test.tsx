import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PayDebtModal } from '@/sections/debts/PayDebtModal'
import type { Account, Debt } from '@/types'

const mockDebt: Debt = {
  id: 'debt-1',
  userId: 'user-1',
  providerName: 'Atome',
  debtType: 'bnpl',
  originalAmount: 5000,
  outstandingAmount: 2000,
  dueDate: '2026-10-31',
  note: null,
  status: 'outstanding',
  paidAt: null,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
}

const mockAccounts: Account[] = [
  {
    accessRole: 'owner',
    accountType: 'debit',
    balance: 3000,
    canManage: true,
    canTransact: true,
    color: '#1e3a8a',
    createdAt: '2026-01-01T00:00:00Z',
    id: 'card-1',
    isActive: true,
    isHidden: false,
    kind: 'card',
    name: 'BDO Debit',
    textColor: '#ffffff',
    userId: 'user-1',
  },
  {
    accessRole: 'owner',
    accountType: 'gcash',
    balance: 500,
    canManage: true,
    canTransact: true,
    color: '#0284c7',
    createdAt: '2026-01-01T00:00:00Z',
    id: 'wallet-1',
    isActive: true,
    isHidden: false,
    kind: 'wallet',
    name: 'GCash',
    textColor: '#ffffff',
    userId: 'user-1',
  },
]

describe('PayDebtModal', () => {
  it('renders remaining balance and defaults payment amount to outstanding balance', () => {
    render(
      <PayDebtModal
        accounts={mockAccounts}
        debt={mockDebt}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        saving={false}
      />,
    )

    expect(screen.getByText(/Atome/i)).toBeInTheDocument()
    const amountInput = screen.getByLabelText(/Payment Amount/i)
    expect(amountInput).toHaveValue(2000)
  })

  it('warns when account has insufficient funds', async () => {
    const user = userEvent.setup()

    render(
      <PayDebtModal
        accounts={mockAccounts}
        debt={mockDebt}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        saving={false}
      />,
    )

    // Select GCash which only has 500 balance (less than 2000 payment)
    const gcashOption = screen.getByRole('radio', { name: /GCash/i })
    await user.click(gcashOption)

    expect(screen.getByText(/Insufficient balance in this account/i)).toBeInTheDocument()
    const submitButton = screen.getByRole('button', { name: /Confirm Repayment/i })
    expect(submitButton).toBeDisabled()
  })

  it('allows submission when funds are sufficient and amount is valid', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(true)

    render(
      <PayDebtModal
        accounts={mockAccounts}
        debt={mockDebt}
        onClose={vi.fn()}
        onSubmit={onSubmit}
        saving={false}
      />,
    )

    // Select BDO Debit which has 3000 balance
    const bdoOption = screen.getByRole('radio', { name: /BDO Debit/i })
    await user.click(bdoOption)

    const submitButton = screen.getByRole('button', { name: /Confirm Repayment/i })
    expect(submitButton).not.toBeDisabled()
    await user.click(submitButton)

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 2000,
        card_id: 'card-1',
        payment_method: 'card',
      }),
    )
  })
})
