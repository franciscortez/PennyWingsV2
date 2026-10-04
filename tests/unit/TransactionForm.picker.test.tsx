import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TransactionForm } from '@/sections/transactions/TransactionForm'
import type { Account, TransactionCategory, TransactionFormValues } from '@/types'

const card: Account = {
  accessRole: 'owner', accountType: 'debit', balance: 100,
  canManage: true, canTransact: true, color: '#000000',
  createdAt: '2026-01-01T00:00:00Z', id: 'card-1', isActive: true,
  isHidden: false, kind: 'card', name: 'BDO Debit', textColor: '#ffffff',
  userId: 'user-1',
}
const cash: Account = {
  ...card, accountType: 'cash', id: 'cash-1', kind: 'wallet', name: 'Cash on Hand', balance: 0,
}
const category: TransactionCategory = {
  color: '#000000', icon: 'wallet', id: 'category-1', name: 'Food', type: 'expense',
}

const renderForm = () => {
  const onSubmit = vi.fn<(values: TransactionFormValues) => Promise<boolean>>().mockResolvedValue(false)
  render(
    <TransactionForm
      cardAccounts={[card]}
      cashAccount={cash}
      categories={[category]}
      dismissDisabled={false}
      lentAccounts={[]}
      onClose={vi.fn()}
      onSubmit={onSubmit}
      saving={false}
      transaction={null}
      walletAccounts={[]}
    />,
  )
  const formDialog = screen.getByRole('dialog', { name: 'New Transaction' })
  const overlay = formDialog.parentElement as HTMLElement
  return { formDialog, onSubmit, overlay }
}

describe('TransactionForm payment picker', () => {
  it('starts on cash and shows the cash account on the tile', () => {
    const { formDialog } = renderForm()

    const tile = within(formDialog).getByRole('button', { name: /Payment Method/ })
    expect(tile).toHaveTextContent('Cash on Hand')
  })

  it('hides the transaction modal while the picker is open and restores it after', () => {
    const { formDialog, overlay } = renderForm()
    expect(overlay).not.toHaveClass('invisible')

    fireEvent.click(within(formDialog).getByRole('button', { name: /Payment Method/ }))
    expect(overlay).toHaveClass('invisible')
    expect(screen.getByRole('dialog', { name: 'Pay with' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /^Cash/ }))
    expect(overlay).not.toHaveClass('invisible')
    expect(within(formDialog).getByRole('button', { name: /Payment Method/ })).toHaveFocus()
  })

  it('keeps entered values while the form is hidden behind the picker', () => {
    const { formDialog } = renderForm()
    const amount = within(formDialog).getByPlaceholderText('0.00')
    fireEvent.change(amount, { target: { value: '125.5' } })

    fireEvent.click(within(formDialog).getByRole('button', { name: /Payment Method/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Bank Card/ }))
    fireEvent.click(screen.getByRole('button', { name: /BDO Debit/ }))

    expect(amount).toHaveValue(125.5)
    expect(within(formDialog).getByRole('button', { name: /Payment Method/ })).toHaveTextContent(
      'BDO Debit',
    )
  })

  it('submits the picked card', async () => {
    const { formDialog, onSubmit } = renderForm()
    fireEvent.change(within(formDialog).getByPlaceholderText('0.00'), { target: { value: '40' } })
    fireEvent.click(within(formDialog).getByRole('button', { name: /Payment Method/ }))
    fireEvent.click(screen.getByRole('button', { name: /^Bank Card/ }))
    fireEvent.click(screen.getByRole('button', { name: /BDO Debit/ }))
    fireEvent.change(within(formDialog).getByLabelText('Category'), {
      target: { value: category.id },
    })
    fireEvent.click(within(formDialog).getByRole('button', { name: 'Save Transaction' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 40, card_id: 'card-1', payment_method: 'card' }),
      ),
    )
  })
})
