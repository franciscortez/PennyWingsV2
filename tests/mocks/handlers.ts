import { http, HttpResponse } from 'msw'

export const handlers = [
  // Profiles
  http.get('*/rest/v1/profiles*', () => {
    return HttpResponse.json([
      {
        id: 'test-user-id',
        full_name: 'Test User',
        avatar_url: null,
        created_at: '2026-01-01T00:00:00Z',
      },
    ])
  }),

  // Bank Cards
  http.get('*/rest/v1/bank_cards*', () => {
    return HttpResponse.json([
      {
        id: 'card-1',
        user_id: 'test-user-id',
        card_name: 'Main Debit',
        card_type: 'debit',
        last_four: '1234',
        balance: 1000,
        is_active: true,
      },
    ])
  }),
  http.post('*/rest/v1/bank_cards*', () => {
    return HttpResponse.json(
      [
        {
          id: 'card-new-1',
          user_id: 'test-user-id',
          card_name: 'UnionBank',
          card_type: 'savings',
          last_four: '4321',
          balance: 10000,
          is_active: true,
        },
      ],
      { status: 201 },
    )
  }),
  http.patch('*/rest/v1/bank_cards*', () => {
    return HttpResponse.json([], { status: 200 })
  }),
  http.delete('*/rest/v1/bank_cards*', () => {
    return HttpResponse.json([], { status: 200 })
  }),

  // E-Wallets
  http.get('*/rest/v1/e_wallets*', () => {
    return HttpResponse.json([
      {
        id: 'wallet-1',
        user_id: 'test-user-id',
        wallet_name: 'GCash',
        wallet_type: 'gcash',
        account_identifier: '09123456789',
        balance: 500,
        is_active: true,
      },
    ])
  }),
  http.post('*/rest/v1/e_wallets*', () => {
    return HttpResponse.json(
      [
        {
          id: 'wallet-new-1',
          user_id: 'test-user-id',
          wallet_name: 'Maya',
          wallet_type: 'maya',
          account_identifier: '09987654321',
          balance: 500,
          is_active: true,
        },
      ],
      { status: 201 },
    )
  }),
  http.patch('*/rest/v1/e_wallets*', () => {
    return HttpResponse.json([], { status: 200 })
  }),
  http.delete('*/rest/v1/e_wallets*', () => {
    return HttpResponse.json([], { status: 200 })
  }),

  // Account memberships & invites
  http.get('*/rest/v1/account_memberships*', () => {
    return HttpResponse.json([])
  }),
  http.delete('*/rest/v1/account_memberships*', () => {
    return HttpResponse.json([], { status: 200 })
  }),
  http.delete('*/rest/v1/joint_account_invites*', () => {
    return HttpResponse.json([], { status: 200 })
  }),

  // Categories
  http.get('*/rest/v1/categories*', () => {
    return HttpResponse.json([
      {
        id: 'cat-income-1',
        name: 'Salary',
        type: 'income',
        icon: 'wallet',
      },
      {
        id: 'cat-expense-1',
        name: 'Food & Dining',
        type: 'expense',
        icon: 'utensils',
      },
    ])
  }),

  // Transactions
  http.head('*/rest/v1/transactions*', () => {
    return new HttpResponse(null, {
      status: 200,
      headers: {
        'content-range': '0-0/1',
      },
    })
  }),
  http.get('*/rest/v1/transactions*', () => {
    return HttpResponse.json(
      [
        {
          id: 'tx-1',
          user_id: 'test-user-id',
          created_by: 'test-user-id',
          type: 'expense',
          amount: 50,
          fee_amount: 0,
          description: 'Groceries',
          transaction_date: '2026-08-17',
          payment_method: 'card',
          card_id: 'card-1',
          wallet_id: null,
          to_card_id: null,
          to_wallet_id: null,
          category_id: 'cat-expense-1',
          created_at: '2026-08-17T10:00:00Z',
          card: { card_name: 'Main Debit', color: '#1e3a8a' },
          wallet: null,
          to_card: null,
          to_wallet: null,
          category: {
            id: 'cat-expense-1',
            name: 'Food & Dining',
            type: 'expense',
            icon: 'utensils',
            color: '#ef4444',
          },
        },
      ],
      {
        headers: {
          'content-range': '0-0/1',
        },
      },
    )
  }),

  // RPC mocks
  http.post('*/rest/v1/rpc/process_transaction_checked', () => {
    return HttpResponse.json(null, { status: 200 })
  }),
  http.post('*/rest/v1/rpc/delete_transaction', () => {
    return HttpResponse.json(null, { status: 200 })
  }),
  http.post('*/rest/v1/rpc/update_transaction_checked', () => {
    return HttpResponse.json(null, { status: 200 })
  }),
]
