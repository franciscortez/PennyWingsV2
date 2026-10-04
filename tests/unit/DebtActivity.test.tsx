import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AddDebtModal } from '@/sections/debts/AddDebtModal'
import { DebtCard } from '@/sections/debts/DebtCard'
import { DebtPaymentHistoryModal } from '@/sections/debts/DebtPaymentHistoryModal'
import type { Debt, DebtCharge, DebtPayment } from '@/types'

const atome: Debt = {
  id: 'debt-1',
  userId: 'user-1',
  providerName: 'Atome',
  debtType: 'bnpl',
  originalAmount: 70,
  outstandingAmount: 70,
  dueDate: null,
  note: null,
  status: 'outstanding',
  paidAt: null,
  createdAt: '2026-10-04T00:00:00Z',
  updatedAt: '2026-10-05T00:00:00Z',
}

const charge = (overrides: Partial<DebtCharge>): DebtCharge => ({
  id: 'charge-1',
  debtId: 'debt-1',
  userId: 'user-1',
  amount: 20,
  chargeDate: '2026-10-04',
  note: null,
  status: 'active',
  voidedAt: null,
  voidReason: null,
  createdAt: '2026-10-04T09:00:00Z',
  ...overrides,
})

const charges: DebtCharge[] = [
  charge({ id: 'charge-1', amount: 20, chargeDate: '2026-10-04' }),
  charge({
    id: 'charge-2',
    amount: 50,
    chargeDate: '2026-10-05',
    createdAt: '2026-10-05T09:00:00Z',
    note: 'Headphones',
  }),
]

const payment: DebtPayment = {
  id: 'payment-1',
  debtId: 'debt-1',
  userId: 'user-1',
  amount: 10,
  paymentDate: '2026-10-06',
  paymentMethod: 'card',
  cardId: 'card-1',
  walletId: null,
  note: null,
  status: 'completed',
  reversedAt: null,
  reversalReason: null,
  createdAt: '2026-10-06T09:00:00Z',
  accountName: 'BDO Debit',
}

describe('DebtCard purchases', () => {
  it('shows total charged, purchase count and an add purchase action', async () => {
    const user = userEvent.setup()
    const onAddPurchase = vi.fn()
    render(
      <DebtCard
        debt={atome}
        onAddPurchase={onAddPurchase}
        onHistory={vi.fn()}
        onPay={vi.fn()}
        purchaseCount={2}
      />,
    )

    expect(screen.getByText(/Total charged: ₱70\.00/)).toBeInTheDocument()
    expect(screen.getByText('2 purchases')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add purchase' }))
    expect(onAddPurchase).toHaveBeenCalledWith(atome)
  })

  it('hides add purchase for archived debts and the count for a single purchase', () => {
    render(
      <DebtCard
        debt={{ ...atome, status: 'archived' }}
        onAddPurchase={vi.fn()}
        onHistory={vi.fn()}
        purchaseCount={1}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Add purchase' })).not.toBeInTheDocument()
    expect(screen.queryByText('1 purchases')).not.toBeInTheDocument()
  })
})

describe('AddDebtModal existing provider hint', () => {
  it('offers to add a purchase when the provider already has a debt', async () => {
    const user = userEvent.setup()
    const onAddPurchaseInstead = vi.fn()
    render(
      <AddDebtModal
        existingDebts={[atome]}
        onAddPurchaseInstead={onAddPurchaseInstead}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        saving={false}
      />,
    )

    await user.type(screen.getByLabelText(/Provider or Creditor Name/i), 'atome')

    const hint = await screen.findByRole('status')
    expect(hint).toHaveTextContent('Atome already has')
    expect(hint).toHaveTextContent('₱70.00')

    await user.click(within(hint).getByRole('button', { name: 'Add purchase' }))
    expect(onAddPurchaseInstead).toHaveBeenCalledWith(atome)
  })

  it('does not show the hint for archived or unrelated providers', async () => {
    const user = userEvent.setup()
    render(
      <AddDebtModal
        existingDebts={[{ ...atome, status: 'archived' }]}
        onAddPurchaseInstead={vi.fn()}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        saving={false}
      />,
    )

    await user.type(screen.getByLabelText(/Provider or Creditor Name/i), 'Atome')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('DebtPaymentHistoryModal activity', () => {
  it('lists purchases and repayments together, newest first', () => {
    render(
      <DebtPaymentHistoryModal
        charges={charges}
        debt={atome}
        onClose={vi.fn()}
        onReverse={vi.fn()}
        onVoidCharge={vi.fn()}
        payments={[payment]}
        saving={false}
      />,
    )

    expect(screen.getByRole('dialog', { name: /Activity: Atome/i })).toBeInTheDocument()
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent('-₱10.00')
    expect(rows[1]).toHaveTextContent('+₱50.00')
    expect(rows[2]).toHaveTextContent('+₱20.00')
  })

  it('voids a purchase after inline confirmation', async () => {
    const user = userEvent.setup()
    const onVoidCharge = vi.fn().mockResolvedValue(true)
    render(
      <DebtPaymentHistoryModal
        charges={charges}
        debt={atome}
        onClose={vi.fn()}
        onReverse={vi.fn()}
        onVoidCharge={onVoidCharge}
        payments={[]}
        saving={false}
      />,
    )

    await user.click(screen.getAllByRole('button', { name: /Void/ })[0])
    expect(screen.getByText('Void this purchase?')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Reason (optional)'), 'Cancelled order')
    await user.click(screen.getByRole('button', { name: 'Confirm Void' }))

    await waitFor(() =>
      expect(onVoidCharge).toHaveBeenCalledWith('charge-2', 'Cancelled order'),
    )
  })

  it('does not offer void when only one active purchase remains', () => {
    render(
      <DebtPaymentHistoryModal
        charges={[charges[0]]}
        debt={{ ...atome, originalAmount: 20, outstandingAmount: 20 }}
        onClose={vi.fn()}
        onReverse={vi.fn()}
        onVoidCharge={vi.fn()}
        payments={[]}
        saving={false}
      />,
    )

    expect(screen.queryByRole('button', { name: /Void/ })).not.toBeInTheDocument()
  })

  it('shows voided purchases struck through with their reason, and an empty state', () => {
    const { rerender } = render(
      <DebtPaymentHistoryModal
        charges={[
          charges[0],
          charge({
            id: 'charge-3',
            amount: 30,
            status: 'voided',
            voidReason: 'Cancelled order',
            chargeDate: '2026-10-05',
          }),
        ]}
        debt={atome}
        onClose={vi.fn()}
        onReverse={vi.fn()}
        onVoidCharge={vi.fn()}
        payments={[]}
        saving={false}
      />,
    )

    expect(screen.getByText('Purchase voided')).toBeInTheDocument()
    expect(screen.getByText('Reason: Cancelled order')).toBeInTheDocument()

    rerender(
      <DebtPaymentHistoryModal
        charges={[]}
        debt={atome}
        onClose={vi.fn()}
        onReverse={vi.fn()}
        payments={[]}
        saving={false}
      />,
    )
    expect(
      screen.getByText(/No purchases or repayments have been recorded/i),
    ).toBeInTheDocument()
  })
})
