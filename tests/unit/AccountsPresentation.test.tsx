import { fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { AccountColorChoices } from '@/sections/accounts/AccountColorChoices'
import { EditAccountModal } from '@/sections/accounts/EditAccountModal'
import { AccountsListSection } from '@/sections/accounts/AccountsListSection'
import { CategoryBalanceCards } from '@/sections/accounts/CategoryBalanceCards'
import { TotalBalanceSection } from '@/sections/accounts/TotalBalanceSection'
import { AccountsSkeleton } from '@/sections/accounts/AccountsSkeleton'
import type { Account } from '@/types'
import { resetDocumentStyles, stubScrollEnvironment } from '../helpers/scrollEnvironment'

const account: Account = {
  id: 'custom-card', name: 'Personal Reserve', kind: 'card', accountType: 'debit', balance: -1234567890.37,
  color: '#F472B6', textColor: '#ffffff', lastFour: '1234', userId: 'owner', createdAt: '2026-01-01',
  isActive: true, isHidden: false, canManage: true, canTransact: true, accessRole: 'owner',
}

vi.mock('@/sections/accounts/BankCardFace', () => ({
  BankCardFace: (props: { design: { primary: string; text: string }; holderName: string }) => (
    <div data-testid="card-face" data-color={props.design.primary} data-text-color={props.design.text}>{props.holderName}</div>
  ),
}))

beforeEach(() => { resetDocumentStyles(); stubScrollEnvironment() })
afterEach(() => { resetDocumentStyles(); vi.restoreAllMocks() })

describe('Accounts presentation contracts', () => {
  it('exposes named colors and allows keyboard selection without changing palette values', async () => {
    const onChange = vi.fn()
    render(<AccountColorChoices label="Account Card Theme" value="#F472B6" onChange={onChange} />)
    const group = screen.getByRole('group', { name: 'Account Card Theme' })
    expect(within(group).getAllByRole('button')).toHaveLength(16)
    expect(within(group).getByRole('button', { name: 'Pink', pressed: true })).toBeInTheDocument()
    const royal = within(group).getByRole('button', { name: 'Royal', pressed: false })
    royal.focus()
    await userEvent.keyboard(' ')
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ label: 'Royal', value: '#2563EB', text: '#ffffff' }))
  })

  it('saves selected colors and unchanged account details through the existing update callback', async () => {
    const onUpdate = vi.fn().mockResolvedValue(true)
    render(<EditAccountModal account={account} onClose={vi.fn()} onUpdate={onUpdate} saving={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Gold' }))
    expect(screen.getByRole('button', { name: 'Gold' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Dark Slate' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Soft Pink' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))
    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith({
      kind: 'card', accountType: 'debit', name: account.name, lastFour: '1234',
      color: '#FBBF24', textColor: '#fce7f3',
    }))
  })

  it('preserves official design detection and blocks dismissal while saving', () => {
    const onClose = vi.fn()
    render(<EditAccountModal account={{ ...account, name: 'BDO Savings' }} onClose={onClose} onUpdate={vi.fn()} saving />)
    expect(screen.queryByRole('group', { name: 'Account Card Theme' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Close edit account' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('keeps large signed category and total figures and all account counts', () => {
    render(<><TotalBalanceSection loading={false} total={-1234567890.37} cardCount={2} walletCount={3} cashCount={1} lentCount={4} />
      <CategoryBalanceCards loading={false} bankBalance={-1234567890.37} walletBalance={123.45} cashBalance={0} lentBalance={56.78} /></>)
    expect(document.querySelector('[data-account-total]')).toHaveTextContent('-₱1,234,567,890.37')
    expect(document.querySelector('[data-account-category="card"]')).toHaveTextContent('-₱1,234,567,890.37')
    expect(document.querySelector('[data-account-category="wallet"]')).toHaveTextContent('₱123.45')
    expect(document.querySelector('[data-account-category="cash"]')).toHaveTextContent('₱0.00')
    expect(document.querySelector('[data-account-category="lent"]')).toHaveTextContent('₱56.78')
    expect(screen.getByText('Total').parentElement).toHaveTextContent('10')
  })

  it.each(['viewer', 'transactor'] as const)('retains %s member actions without exposing owner controls', role => {
    const member = { ...account, accessRole: role, canManage: false, canTransact: role === 'transactor', membershipId: 'membership' }
    const onToggleHidden = vi.fn(), onLeave = vi.fn()
    render(<AccountsListSection accounts={[member]} currentUserId="member" loading={false} emptyTitle="Empty" emptyDescription="" variant="all" onEdit={vi.fn()} onArchive={vi.fn()} onShare={vi.fn()} onLeave={onLeave} onToggleHidden={onToggleHidden} />)
    expect(screen.queryByRole('button', { name: `Edit ${account.name}` })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: `Share ${account.name}` })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: `Hide ${account.name}` }))
    fireEvent.click(screen.getByRole('button', { name: `Leave ${account.name}` }))
    expect(onToggleHidden).toHaveBeenCalledWith(member)
    expect(onLeave).toHaveBeenCalledWith(member)
    expect(screen.getByTestId('card-face')).toHaveAttribute('data-color', account.color)
    expect(screen.getByTestId('card-face')).toHaveAttribute('data-text-color', account.textColor)
  })

  it('preserves owner callbacks and archived busy guards', () => {
    const onEdit = vi.fn(), onShare = vi.fn(), onArchive = vi.fn()
    const props = { accounts: [account], currentUserId: 'owner', loading: false, emptyTitle: 'Empty', emptyDescription: '', variant: 'all' as const, onEdit, onShare, onArchive }
    const { rerender } = render(<AccountsListSection {...props} />)
    fireEvent.click(screen.getByRole('button', { name: `Edit ${account.name}` }))
    fireEvent.click(screen.getByRole('button', { name: `Share ${account.name}` }))
    fireEvent.click(screen.getByRole('button', { name: `Delete ${account.name}` }))
    for (const callback of [onEdit, onShare, onArchive]) expect(callback).toHaveBeenCalledWith(account)
    rerender(<AccountsListSection {...props} archivedView restoringId={account.id} onRestore={vi.fn()} />)
    expect(screen.getByRole('button', { name: `Restore ${account.name}` })).toBeDisabled()
    expect(screen.getByRole('button', { name: `Permanently delete ${account.name}` })).toBeDisabled()
  })

  it('retains one loading heading and gates every pulse on motion preference', () => {
    render(<AccountsSkeleton />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('My Accounts')
    expect(screen.getByLabelText('Loading accounts')).toHaveAttribute('aria-busy', 'true')
    expect(document.querySelectorAll('[class~="animate-pulse"]')).toHaveLength(0)
    expect(document.querySelectorAll('[class~="motion-safe:animate-pulse"]').length).toBeGreaterThan(0)
  })
})
