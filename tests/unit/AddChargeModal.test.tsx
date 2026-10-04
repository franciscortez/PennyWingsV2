import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AddChargeModal } from '@/sections/debts/AddChargeModal'
import type { Debt } from '@/types'

const atome: Debt = {
  id: 'debt-1',
  userId: 'user-1',
  providerName: 'Atome',
  debtType: 'bnpl',
  originalAmount: 20,
  outstandingAmount: 20,
  dueDate: null,
  note: null,
  status: 'outstanding',
  paidAt: null,
  createdAt: '2026-10-04T00:00:00Z',
  updatedAt: '2026-10-04T00:00:00Z',
}

describe('AddChargeModal', () => {
  it('previews the balance after adding a purchase', async () => {
    const user = userEvent.setup()
    render(<AddChargeModal debt={atome} onClose={vi.fn()} onSubmit={vi.fn()} saving={false} />)

    expect(screen.getByRole('dialog', { name: /Add Purchase: Atome/i })).toBeInTheDocument()

    const preview = screen.getByText('Owed after').parentElement as HTMLElement
    expect(preview).toHaveTextContent('₱20.00')

    await user.type(screen.getByLabelText(/Purchase Amount/i), '50')

    expect(preview).toHaveTextContent('₱70.00')
  })

  it('submits the purchase for the debt and closes on success', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(true)
    const onClose = vi.fn()
    render(<AddChargeModal debt={atome} onClose={onClose} onSubmit={onSubmit} saving={false} />)

    await user.type(screen.getByLabelText(/Purchase Amount/i), '50')
    await user.type(screen.getByLabelText(/Note/i), 'Headphones')
    await user.click(screen.getByRole('button', { name: 'Add Purchase' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 50, debt_id: 'debt-1', note: 'Headphones' }),
    )
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('shows a validation error and does not submit without an amount', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<AddChargeModal debt={atome} onClose={vi.fn()} onSubmit={onSubmit} saving={false} />)

    await user.click(screen.getByRole('button', { name: 'Add Purchase' }))

    expect(await screen.findByText('Enter a valid purchase amount.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('stays open when the server rejects the purchase', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onSubmit = vi.fn().mockResolvedValue(false)
    render(<AddChargeModal debt={atome} onClose={onClose} onSubmit={onSubmit} saving={false} />)

    await user.type(screen.getByLabelText(/Purchase Amount/i), '50')
    await user.click(screen.getByRole('button', { name: 'Add Purchase' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onClose).not.toHaveBeenCalled()
  })
})
