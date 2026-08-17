import { fireEvent, render, screen } from '@testing-library/react'
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

  it('renders search input and handles search query typing', () => {
    render(<TransactionsTable {...defaultProps} />)
    const searchInput = screen.getByPlaceholderText(/description, category\.\.\./i)
    fireEvent.change(searchInput, { target: { value: 'coffee' } })
    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('coffee')
  })
})
