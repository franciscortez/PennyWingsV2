import { render, screen, within } from '@testing-library/react'
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
  {
    accessRole: 'owner',
    accountType: 'cash',
    balance: 5000,
    canManage: true,
    canTransact: true,
    color: '#047857',
    createdAt: '2026-01-01T00:00:00Z',
    id: 'cash-1',
    isActive: true,
    isHidden: false,
    kind: 'cash',
    name: 'Cash on Hand',
    textColor: '#ffffff',
    userId: 'user-1',
  },
  {
    accessRole: 'owner',
    accountType: 'lent',
    balance: 9000,
    canManage: true,
    canTransact: true,
    color: '#7c3aed',
    createdAt: '2026-01-01T00:00:00Z',
    id: 'lent-1',
    isActive: true,
    isHidden: false,
    kind: 'lent',
    name: 'Lent to Ana',
    textColor: '#ffffff',
    userId: 'user-1',
  },
]

const renderModal = (overrides: Partial<Parameters<typeof PayDebtModal>[0]> = {}) => {
  const onSubmit = vi.fn().mockResolvedValue(true)
  const onClose = vi.fn()
  render(
    <PayDebtModal
      accounts={mockAccounts}
      debt={mockDebt}
      onClose={onClose}
      onSubmit={onSubmit}
      saving={false}
      {...overrides}
    />,
  )
  return { onClose, onSubmit, repay: screen.getByRole('dialog', { name: /Repay Atome/i }) }
}

// The source account is a tile that opens its own modal: method, then account.
const chooseSource = async (
  user: ReturnType<typeof userEvent.setup>,
  repay: HTMLElement,
  method: string,
  account?: string,
) => {
  await user.click(within(repay).getByRole('button', { name: /Source Account/ }))
  const sheet = screen.getAllByRole('dialog').at(-1) as HTMLElement
  await user.click(within(sheet).getByRole('button', { name: new RegExp(`^${method}`) }))
  if (account) {
    const accounts = screen.getAllByRole('dialog').at(-1) as HTMLElement
    await user.click(within(accounts).getByRole('button', { name: new RegExp(account) }))
  }
}

describe('PayDebtModal', () => {
  it('renders remaining balance and defaults payment amount to outstanding balance', () => {
    renderModal()

    expect(screen.getByText(/Atome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Payment Amount/i)).toHaveValue(2000)
  })

  it('asks for a source account and blocks confirming until one is picked', () => {
    renderModal()

    const tile = screen.getByRole('button', { name: /Source Account/ })
    expect(tile).toHaveTextContent('Choose a source account')
    expect(screen.getByRole('button', { name: /Confirm Repayment/i })).toBeDisabled()
  })

  it('hides the repay modal while the source picker is open and restores it after', async () => {
    const user = userEvent.setup()
    const { repay } = renderModal()
    const overlay = repay.parentElement as HTMLElement
    expect(overlay).not.toHaveClass('invisible')

    await user.click(within(repay).getByRole('button', { name: /Source Account/ }))
    expect(overlay).toHaveClass('invisible')
    expect(screen.getByRole('dialog', { name: 'Pay from' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Cash/ }))
    expect(overlay).not.toHaveClass('invisible')
    expect(within(repay).getByRole('button', { name: /Source Account/ })).toHaveFocus()
  })

  it('does not offer lent accounts as a repayment source', async () => {
    const user = userEvent.setup()
    const { repay } = renderModal()
    await user.click(within(repay).getByRole('button', { name: /Source Account/ }))
    const sheet = screen.getAllByRole('dialog').at(-1) as HTMLElement

    expect(within(sheet).queryByRole('button', { name: /^Lent/ })).not.toBeInTheDocument()
    await user.click(within(sheet).getByRole('button', { name: /^E-Wallet/ }))
    expect(screen.queryByRole('button', { name: /Lent to Ana/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /GCash/ })).toBeInTheDocument()
  })

  it('marks accounts that cannot cover the payment in the picker', async () => {
    const user = userEvent.setup()
    const { repay } = renderModal()
    await user.click(within(repay).getByRole('button', { name: /Source Account/ }))
    const sheet = screen.getAllByRole('dialog').at(-1) as HTMLElement
    await user.click(within(sheet).getByRole('button', { name: /^E-Wallet/ }))

    expect(screen.getByRole('button', { name: /GCash/ })).toHaveTextContent('Insufficient')
  })

  it('warns when the chosen account has insufficient funds', async () => {
    const user = userEvent.setup()
    const { repay } = renderModal()

    // GCash only has 500 against a 2000 payment.
    await chooseSource(user, repay, 'E-Wallet', 'GCash')

    expect(screen.getByText(/Insufficient balance in this account/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Confirm Repayment/i })).toBeDisabled()
  })

  it('allows submission with a bank card that has enough funds', async () => {
    const user = userEvent.setup()
    const { repay, onSubmit } = renderModal()

    await chooseSource(user, repay, 'Bank Card', 'BDO Debit')

    expect(within(repay).getByRole('button', { name: /Source Account/ })).toHaveTextContent('BDO Debit')
    const submitButton = screen.getByRole('button', { name: /Confirm Repayment/i })
    expect(submitButton).not.toBeDisabled()
    await user.click(submitButton)

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 2000,
        card_id: 'card-1',
        payment_method: 'card',
        wallet_id: null,
      }),
    )
  })

  it('repays from cash on hand with the cash payment method', async () => {
    const user = userEvent.setup()
    const { repay, onSubmit } = renderModal()

    await chooseSource(user, repay, 'Cash')
    await user.click(screen.getByRole('button', { name: /Confirm Repayment/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ card_id: null, payment_method: 'cash', wallet_id: 'cash-1' }),
    )
  })

  it('repays from an e-wallet with the ewallet payment method', async () => {
    const user = userEvent.setup()
    const { repay, onSubmit } = renderModal({ debt: { ...mockDebt, outstandingAmount: 300 } })

    await chooseSource(user, repay, 'E-Wallet', 'GCash')
    await user.click(screen.getByRole('button', { name: /Confirm Repayment/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 300, card_id: null, payment_method: 'ewallet', wallet_id: 'wallet-1' }),
    )
  })
})
