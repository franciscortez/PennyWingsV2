import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { TransactionForm } from '@/sections/transactions/TransactionForm'
import type { Account, Transaction, TransactionCategory, TransactionFormValues } from '@/types'

const card: Account = {
  accessRole: 'owner', accountType: 'debit', balance: 100,
  canManage: true, canTransact: true, color: '#000000',
  createdAt: '2026-01-01T00:00:00Z', id: 'card-1', isActive: true,
  isHidden: false, kind: 'card', name: 'Source card', textColor: '#ffffff',
  userId: 'user-1',
}

const otherCard: Account = { ...card, id: 'card-2', name: 'Other source card' }

const wallet: Account = {
  ...card,
  accountType: 'gcash', id: 'wallet-1', kind: 'wallet', name: 'Destination wallet',
}

const lent: Account = {
  ...wallet,
  accountType: 'lent', id: 'lent-1', kind: 'lent', name: 'Lent source',
}

const category: TransactionCategory = {
  color: '#000000', icon: 'wallet', id: 'category-1', name: 'Transfers', type: 'expense',
}

const existingTransfer: Transaction = {
  amount: 40, card_id: card.id, category_id: category.id, created_by: 'user-1',
  description: 'Old note', fee_amount: 15, id: 'transaction-1', payment_method: 'card',
  to_card_id: null, to_wallet_id: wallet.id, transaction_date: '2026-09-23',
  type: 'transfer', user_id: 'user-1', wallet_id: null,
  to_wallet: { name: wallet.name, walletType: 'gcash' },
}

const existingWithdrawal: Transaction = {
  ...existingTransfer,
  to_wallet: null,
  to_wallet_id: null,
  type: 'withdrawal',
}

const renderForm = (transaction: Transaction | null = null) => {
  const onSubmit = vi.fn<(values: TransactionFormValues) => Promise<boolean>>().mockResolvedValue(false)
  render(
    <TransactionForm
      cardAccounts={[card, otherCard]}
      cashAccount={null}
      categories={[category]}
      dismissDisabled={false}
      lentAccounts={[lent]}
      onClose={vi.fn()}
      onSubmit={onSubmit}
      saving={false}
      transaction={transaction}
      walletAccounts={[wallet]}
    />,
  )
  return { dialog: screen.getByRole('dialog'), onSubmit }
}

const completeNewTransfer = (dialog: HTMLElement) => {
  fireEvent.click(within(dialog).getByRole('button', { name: 'Transfer/Deposit' }))
  fireEvent.change(within(dialog).getAllByRole('spinbutton')[0], { target: { value: '40' } })
  fireEvent.change(within(dialog).getAllByRole('combobox')[0], { target: { value: 'card' } })
  fireEvent.change(within(dialog).getAllByRole('combobox')[1], { target: { value: card.id } })
  fireEvent.change(within(dialog).getAllByRole('combobox')[2], { target: { value: 'ewallet' } })
  fireEvent.change(within(dialog).getAllByRole('combobox')[3], { target: { value: wallet.id } })
  fireEvent.change(within(dialog).getAllByRole('combobox')[4], { target: { value: category.id } })
}

const completeNewWithdrawal = (dialog: HTMLElement) => {
  fireEvent.click(within(dialog).getByRole('button', { name: 'withdrawal' }))
  fireEvent.change(within(dialog).getAllByRole('spinbutton')[0], { target: { value: '40' } })
  fireEvent.change(within(dialog).getAllByRole('combobox')[0], { target: { value: 'card' } })
  fireEvent.change(within(dialog).getAllByRole('combobox')[1], { target: { value: card.id } })
  fireEvent.change(within(dialog).getByLabelText('Category'), { target: { value: category.id } })
}

describe('TransactionForm transfer fees', () => {
  it.each([0, 15, 25, 12.34])('submits validated fee %s', async (fee) => {
    const { dialog, onSubmit } = renderForm()
    completeNewTransfer(dialog)
    fireEvent.change(within(dialog).getByLabelText('Transfer Fee (PHP)'), {
      target: { value: String(fee) },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Transaction' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      amount: 40, fee_amount: fee, type: 'transfer',
    })))
  })

  it('preserves the fee when editing only the note', async () => {
    const { dialog, onSubmit } = renderForm(existingTransfer)
    expect(within(dialog).getByLabelText('Transfer Fee (PHP)')).toHaveValue('15')
    fireEvent.change(within(dialog).getByPlaceholderText('Short note...'), {
      target: { value: 'New note' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Update Transaction' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      description: 'New note', fee_amount: 15,
    })))
  })

  it('clears the hidden fee when switching away from Transfer', async () => {
    const { dialog, onSubmit } = renderForm(existingTransfer)
    fireEvent.click(within(dialog).getByRole('button', { name: 'expense' }))
    fireEvent.change(within(dialog).getByLabelText('Category'), {
      target: { value: category.id },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Update Transaction' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      fee_amount: 0, type: 'expense',
    })))
  })

  it.each(['-1', 'invalid'])('rejects invalid fee %s without submitting', async (fee) => {
    const { dialog, onSubmit } = renderForm()
    completeNewTransfer(dialog)
    fireEvent.change(within(dialog).getByLabelText('Transfer Fee (PHP)'), {
      target: { value: fee },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Transaction' }))

    await waitFor(() => expect(within(dialog).getByText(/Fee (cannot be negative|must be a valid number)/)).toBeVisible())
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('TransactionForm withdrawal fees', () => {
  it.each([0, 15, 25, 12.34])('submits validated withdrawal fee %s', async (fee) => {
    const { dialog, onSubmit } = renderForm()
    completeNewWithdrawal(dialog)
    fireEvent.change(within(dialog).getByLabelText('Withdrawal Fee (PHP)'), {
      target: { value: String(fee) },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Transaction' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      amount: 40, fee_amount: fee, type: 'withdrawal',
    })))
  })

  it('preserves the fee when editing a note and accepts an edited fee', async () => {
    const { dialog, onSubmit } = renderForm(existingWithdrawal)
    const feeInput = within(dialog).getByLabelText('Withdrawal Fee (PHP)')
    expect(feeInput).toHaveValue('15')
    fireEvent.change(within(dialog).getByPlaceholderText('Short note...'), {
      target: { value: 'Changed note' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Update Transaction' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      description: 'Changed note', fee_amount: 15,
    })))

    fireEvent.change(feeInput, { target: { value: '25' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Update Transaction' }))
    await waitFor(() => expect(onSubmit).toHaveBeenLastCalledWith(expect.objectContaining({
      fee_amount: 25,
    })))
  })

  it('clears the fee when the source card or payment method changes', () => {
    const { dialog } = renderForm(existingWithdrawal)
    const feeInput = within(dialog).getByLabelText('Withdrawal Fee (PHP)')
    fireEvent.change(within(dialog).getAllByRole('combobox')[1], {
      target: { value: otherCard.id },
    })
    expect(feeInput).toHaveValue('0')

    fireEvent.change(feeInput, { target: { value: '25' } })
    fireEvent.change(within(dialog).getAllByRole('combobox')[0], {
      target: { value: 'ewallet' },
    })
    expect(feeInput).toHaveValue('0')
    fireEvent.change(within(dialog).getAllByRole('combobox')[1], {
      target: { value: wallet.id },
    })
    expect(within(dialog).getByLabelText('Withdrawal Fee (PHP)')).toBeVisible()
  })

  it('shows the fee for lent withdrawals and clears it on transaction type changes', () => {
    const { dialog } = renderForm(existingWithdrawal)
    fireEvent.change(within(dialog).getAllByRole('combobox')[0], {
      target: { value: 'lent' },
    })
    fireEvent.change(within(dialog).getAllByRole('combobox')[1], {
      target: { value: lent.id },
    })
    const feeInput = within(dialog).getByLabelText('Withdrawal Fee (PHP)')
    fireEvent.change(feeInput, { target: { value: '12.34' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Transfer/Deposit' }))
    expect(within(dialog).getByLabelText('Transfer Fee (PHP)')).toHaveValue('0')
    fireEvent.change(within(dialog).getByLabelText('Transfer Fee (PHP)'), {
      target: { value: '15' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'withdrawal' }))
    expect(within(dialog).getByLabelText('Withdrawal Fee (PHP)')).toHaveValue('0')
  })

  it.each(['-1', 'invalid'])('rejects withdrawal fee %s without submitting', async (fee) => {
    const { dialog, onSubmit } = renderForm()
    completeNewWithdrawal(dialog)
    fireEvent.change(within(dialog).getByLabelText('Withdrawal Fee (PHP)'), {
      target: { value: fee },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save Transaction' }))

    await waitFor(() => expect(within(dialog).getByText(/Fee (cannot be negative|must be a valid number)/)).toBeVisible())
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
