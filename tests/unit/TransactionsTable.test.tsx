import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TransactionsTable } from '@/sections/transactions/TransactionsTable'
import type { Transaction } from '@/types'

describe('TransactionsTable UI Component', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      user_id: 'user-1',
      created_by: 'user-1',
      amount: 1500,
      fee_amount: 10,
      description: 'Grocery Shopping',
      transaction_date: '2026-08-17',
      payment_method: 'card',
      card_id: 'card-1',
      wallet_id: null,
      to_card_id: null,
      to_wallet_id: null,
      category_id: 'cat-1',
      category: {
        id: 'cat-1',
        name: 'Groceries',
        type: 'expense',
        icon: 'shopping-cart',
        color: '#ef4444',
      },
      card: {
        name: 'BDO Card',
        color: '#1e3a8a',
        walletType: null,
      },
      wallet: null,
      to_card: null,
      to_wallet: null,
      type: 'expense',
    },
  ]

  const defaultProps = {
    currentUserId: 'user-1',
    deletingId: null,
    filterType: 'all' as const,
    loading: false,
    onDelete: vi.fn(),
    onEdit: vi.fn(),
    onFilterChange: vi.fn(),
    onPageChange: vi.fn(),
    onSearchChange: vi.fn(),
    page: 1,
    pageSize: 10,
    searchQuery: '',
    totalCount: 1,
    totalPages: 1,
    transactions: mockTransactions,
  }

  it('renders transactions list with description and amounts', () => {
    render(<TransactionsTable {...defaultProps} />)
    expect(screen.getAllByText('Grocery Shopping').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Groceries').length).toBeGreaterThan(0)
  })

  it('renders filter pills and fires onFilterChange when clicked', () => {
    render(<TransactionsTable {...defaultProps} />)
    const incomeFilter = screen.getByRole('button', { name: /^income/i })
    fireEvent.click(incomeFilter)
    expect(defaultProps.onFilterChange).toHaveBeenCalledWith('income')
  })

  it('renders empty state message when transaction list is empty', () => {
    render(<TransactionsTable {...defaultProps} transactions={[]} totalCount={0} />)
    expect(screen.getByText(/no entries found/i)).toBeInTheDocument()
  })

  it('shows typing at once and reports the search once after a pause', () => {
    vi.useFakeTimers()
    try {
      const onSearchChange = vi.fn()
      render(<TransactionsTable {...defaultProps} onSearchChange={onSearchChange} />)
      const searchInput = screen.getByPlaceholderText(/description, category\.\.\./i)

      fireEvent.change(searchInput, { target: { value: 'cof' } })
      fireEvent.change(searchInput, { target: { value: 'coffee' } })

      expect(searchInput).toHaveValue('coffee')
      expect(onSearchChange).not.toHaveBeenCalled()

      act(() => {
        vi.advanceTimersByTime(250)
      })
      expect(onSearchChange).toHaveBeenCalledTimes(1)
      expect(onSearchChange).toHaveBeenCalledWith('coffee')
    } finally {
      vi.useRealTimers()
    }
  })

  it.each([
    ['income', '+'], ['expense', '-'], ['withdrawal', '-'], ['transfer', ''],
  ] as const)('preserves %s amount, type and fee text in both presentations', (type, prefix) => {
    const transaction = { ...mockTransactions[0], type, amount: 999999999999.99, fee_amount: 12.34 }
    render(<TransactionsTable {...defaultProps} transactions={[transaction]} />)
    const expected = prefix + new Intl.NumberFormat('en-PH', { currency: 'PHP', maximumFractionDigits: 2, style: 'currency' }).format(transaction.amount)
    for (const presentation of [screen.getByRole('article'), screen.getByRole('table')]) {
      expect(presentation.querySelector('[data-transaction-amount]')).toHaveTextContent(expected)
      expect(presentation.querySelector('[data-transaction-fee]')).toHaveTextContent('+ ₱12.34 fee')
      expect(within(presentation).getByText(type)).toBeInTheDocument()
    }
  })

  it('keeps non-owner rows view-only and disables both actions during deletion', () => {
    const { rerender } = render(<TransactionsTable {...defaultProps} currentUserId="someone-else" />)
    expect(screen.queryByRole('button', { name: 'Edit transaction' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Delete transaction' })).toBeNull()
    expect(screen.getAllByText('View only')).toHaveLength(2)
    rerender(<TransactionsTable {...defaultProps} deletingId="tx-1" />)
    for (const button of screen.getAllByRole('button', { name: /^(Edit|Delete) transaction$/ })) {
      expect(button).toBeDisabled()
    }
  })

  it('announces selected filter and keeps pagination boundaries and callbacks', () => {
    const { rerender } = render(<TransactionsTable {...defaultProps} filterType="income" totalCount={70} totalPages={7} />)
    expect(screen.getByRole('button', { name: /^income/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^all$/i })).toHaveAttribute('aria-pressed', 'false')
    const pagination = within(screen.getByRole('navigation', { name: 'Transaction pagination' }))
    expect(pagination.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(pagination.getByRole('button', { name: /^1$/ })).toHaveAttribute('aria-current', 'page')
    fireEvent.click(pagination.getByRole('button', { name: 'Next page' }))
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(2)
    fireEvent.click(pagination.getByRole('button', { name: /^7$/ }))
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(7)
    rerender(<TransactionsTable {...defaultProps} page={7} totalCount={70} totalPages={7} />)
    expect(pagination.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('keeps edit and delete callbacks wired to the same transaction in both views', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(<TransactionsTable {...defaultProps} onEdit={onEdit} onDelete={onDelete} />)
    for (const presentation of [screen.getByRole('article'), screen.getByRole('table')]) {
      fireEvent.click(within(presentation).getByRole('button', { name: 'Edit transaction' }))
      fireEvent.click(within(presentation).getByRole('button', { name: 'Delete transaction' }))
    }
    expect(onEdit).toHaveBeenCalledTimes(2)
    expect(onDelete).toHaveBeenCalledTimes(2)
    expect(onEdit).toHaveBeenCalledWith(mockTransactions[0])
    expect(onDelete).toHaveBeenCalledWith(mockTransactions[0])
  })
})
