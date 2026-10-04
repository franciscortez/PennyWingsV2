import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { PaymentSourcePicker } from '@/sections/transactions/PaymentSourcePicker'
import type { Account } from '@/types'

const base: Account = {
  accessRole: 'owner', accountType: 'debit', balance: 1250.5,
  canManage: true, canTransact: true, color: '#000000',
  createdAt: '2026-01-01T00:00:00Z', id: 'card-1', isActive: true,
  isHidden: false, kind: 'card', name: 'BDO Debit', textColor: '#ffffff',
  userId: 'user-1',
}

const otherCard: Account = { ...base, id: 'card-2', name: 'BPI Credit', accountType: 'credit', balance: 80 }
const gcash: Account = { ...base, id: 'wallet-1', kind: 'wallet', accountType: 'gcash', name: 'GCash', balance: 300 }
const cash: Account = { ...base, id: 'cash-1', kind: 'wallet', accountType: 'cash', name: 'Cash on Hand', balance: 0 }
const lent: Account = { ...base, id: 'lent-1', kind: 'lent', accountType: 'lent', name: 'Lent to Ana', balance: 500 }

type Props = Parameters<typeof PaymentSourcePicker>[0]

const renderPicker = (overrides: Partial<Props> = {}) => {
  const onChange = vi.fn()
  const props: Props = {
    allowCash: true,
    allowLent: false,
    cardAccounts: [base, otherCard],
    cardId: '',
    cashAccount: cash,
    errorId: 'picker-error',
    label: 'Payment Method',
    lentAccounts: [lent],
    method: 'cash',
    onChange,
    walletAccounts: [gcash],
    walletId: '',
    ...overrides,
  }
  render(<PaymentSourcePicker {...props} />)
  return { onChange, user: userEvent.setup() }
}

const openSheet = async (user: ReturnType<typeof userEvent.setup>, label = 'Payment Method') => {
  await user.click(screen.getByRole('button', { name: new RegExp(label) }))
  return screen.getByRole('dialog')
}

describe('PaymentSourcePicker', () => {
  it('shows the current method, account and balance on the tile', () => {
    renderPicker()

    const tile = screen.getByRole('button', { name: /Payment Method/ })
    expect(tile).toHaveAttribute('aria-haspopup', 'dialog')
    expect(tile).toHaveTextContent('Cash on Hand')
    expect(tile).toHaveTextContent('₱0.00')
  })

  it('shows a choose prompt when a card method has no account yet', () => {
    renderPicker({ method: 'card' })

    expect(screen.getByRole('button', { name: /Payment Method/ })).toHaveTextContent(
      'Choose a bank card',
    )
  })

  it('shows the selected card name and balance', () => {
    renderPicker({ cardId: 'card-1', method: 'card' })

    const tile = screen.getByRole('button', { name: /Payment Method/ })
    expect(tile).toHaveTextContent('BDO Debit')
    expect(tile).toHaveTextContent('₱1,250.50')
  })

  it('lists the available methods in the sheet', async () => {
    const { user } = renderPicker()
    const sheet = await openSheet(user)

    expect(within(sheet).getByRole('button', { name: /Cash/ })).toBeEnabled()
    expect(within(sheet).getByRole('button', { name: /Bank Card/ })).toBeEnabled()
    expect(within(sheet).getByRole('button', { name: /E-Wallet/ })).toBeEnabled()
    expect(within(sheet).queryByRole('button', { name: /Lent/ })).not.toBeInTheDocument()
  })

  it('selects cash immediately and closes', async () => {
    const { onChange, user } = renderPicker({ method: 'card', cardId: 'card-1' })
    const sheet = await openSheet(user)

    await user.click(within(sheet).getByRole('button', { name: /Cash/ }))

    expect(onChange).toHaveBeenCalledWith('cash', '')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('goes to the account step for a bank card and selects one', async () => {
    const { onChange, user } = renderPicker()
    const sheet = await openSheet(user)

    await user.click(within(sheet).getByRole('button', { name: /Bank Card/ }))

    const accounts = screen.getByRole('dialog', { name: 'Choose a bank card' })
    expect(within(accounts).getByRole('button', { name: /BDO Debit/ })).toHaveTextContent('₱1,250.50')
    await user.click(within(accounts).getByRole('button', { name: /BPI Credit/ }))

    expect(onChange).toHaveBeenCalledWith('card', 'card-2')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('selects an e-wallet account', async () => {
    const { onChange, user } = renderPicker()
    const sheet = await openSheet(user)

    await user.click(within(sheet).getByRole('button', { name: /E-Wallet/ }))
    await user.click(screen.getByRole('button', { name: /GCash/ }))

    expect(onChange).toHaveBeenCalledWith('ewallet', 'wallet-1')
  })

  it('returns to the method step with the back button', async () => {
    const { onChange, user } = renderPicker()
    const sheet = await openSheet(user)
    await user.click(within(sheet).getByRole('button', { name: /Bank Card/ }))

    await user.click(screen.getByRole('button', { name: 'Back to payment methods' }))

    expect(screen.getByRole('dialog', { name: 'Pay with' })).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('hides cash when it is not allowed', async () => {
    const { user } = renderPicker({ allowCash: false, method: 'card' })
    const sheet = await openSheet(user)

    expect(within(sheet).queryByRole('button', { name: /^Cash/ })).not.toBeInTheDocument()
  })

  it('offers lent accounts when allowed', async () => {
    const { onChange, user } = renderPicker({ allowLent: true })
    const sheet = await openSheet(user)

    await user.click(within(sheet).getByRole('button', { name: /Lent/ }))
    await user.click(screen.getByRole('button', { name: /Lent to Ana/ }))

    expect(onChange).toHaveBeenCalledWith('lent', 'lent-1')
  })

  it('disables a method that has no accounts and explains why', async () => {
    const { user } = renderPicker({ walletAccounts: [] })
    const sheet = await openSheet(user)

    const wallet = within(sheet).getByRole('button', { name: /E-Wallet/ })
    expect(wallet).toBeDisabled()
    expect(wallet).toHaveTextContent('No e-wallets yet')
  })

  it('disables cash when there is no cash account', async () => {
    const { user } = renderPicker({ cashAccount: null, method: 'card' })
    const sheet = await openSheet(user)

    expect(within(sheet).getByRole('button', { name: /Cash/ })).toBeDisabled()
  })

  it('leaves out excluded accounts such as the source of a transfer', async () => {
    const { user } = renderPicker({ excludeCardId: 'card-1', label: 'To Account' })
    const sheet = await openSheet(user, 'To Account')
    await user.click(within(sheet).getByRole('button', { name: /Bank Card/ }))

    expect(screen.queryByRole('button', { name: /BDO Debit/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /BPI Credit/ })).toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the tile', async () => {
    const { onChange, user } = renderPicker()
    await openSheet(user)

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Payment Method/ })).toHaveFocus()
  })

  it('shows a prompt instead of a default method when nothing is selected yet', () => {
    renderPicker({ unselected: true, label: 'Source Account' })

    const tile = screen.getByRole('button', { name: /Source Account/ })
    expect(tile).toHaveTextContent('Choose a source account')
    expect(tile).not.toHaveTextContent('Cash on Hand')
    expect(tile).not.toHaveTextContent('₱')
  })

  it('does not mark any method as current while unselected', async () => {
    const { user } = renderPicker({ unselected: true })
    const sheet = await openSheet(user)

    expect(within(sheet).getByRole('button', { name: /^Cash/ })).not.toHaveAttribute('aria-current')
  })

  it('flags accounts that cannot cover the required amount', async () => {
    const { user } = renderPicker({ requiredAmount: 1000, cardAccounts: [base, otherCard] })
    const sheet = await openSheet(user)

    expect(within(sheet).getByRole('button', { name: /^Cash/ })).toHaveTextContent('Insufficient')

    await user.click(within(sheet).getByRole('button', { name: /^Bank Card/ }))
    expect(screen.getByRole('button', { name: /BPI Credit/ })).toHaveTextContent('Insufficient')
    expect(screen.getByRole('button', { name: /BDO Debit/ })).not.toHaveTextContent('Insufficient')
  })

  it('reports open and close so a parent modal can step aside', async () => {
    const onOpenChange = vi.fn()
    const { user } = renderPicker({ onOpenChange })
    onOpenChange.mockClear()

    await openSheet(user)
    expect(onOpenChange).toHaveBeenLastCalledWith(true)

    await user.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it('exposes the error on the tile', () => {
    renderPicker({ error: 'Select a card.', method: 'card' })

    const tile = screen.getByRole('button', { name: /Payment Method/ })
    expect(tile).toHaveAttribute('aria-invalid', 'true')
    expect(tile).toHaveAttribute('aria-describedby', 'picker-error')
  })
})
