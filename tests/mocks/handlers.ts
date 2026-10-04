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
        status: 'active',
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
          status: 'active',
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
        status: 'active',
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

  // Debts REST & RPCs
  http.get('*/rest/v1/debts*', ({ request }) => {
    const debts = [
      {
        id: 'debt-1',
        user_id: 'test-user-id',
        provider_name: 'Atome',
        debt_type: 'bnpl',
        original_amount: 3000,
        outstanding_amount: 1500,
        due_date: '2026-10-31',
        note: 'Gadget installment',
        status: 'outstanding',
        paid_at: null,
        created_at: '2026-10-01T00:00:00Z',
        updated_at: '2026-10-01T00:00:00Z',
      },
      {
        id: 'debt-2',
        user_id: 'test-user-id',
        provider_name: 'SPayLater',
        debt_type: 'bnpl',
        original_amount: 5000,
        outstanding_amount: 0,
        due_date: '2026-09-15',
        note: 'Shoes',
        status: 'paid',
        paid_at: '2026-09-15T12:00:00Z',
        created_at: '2026-08-15T00:00:00Z',
        updated_at: '2026-09-15T12:00:00Z',
      },
    ]

    const accept = request.headers.get('accept')
    if (accept?.includes('application/vnd.pgrst.object+json')) {
      return HttpResponse.json(debts[0])
    }

    return HttpResponse.json(debts)
  }),
  http.get('*/rest/v1/debt_payments*', () => {
    return HttpResponse.json([
      {
        id: 'payment-1',
        debt_id: 'debt-1',
        user_id: 'test-user-id',
        amount: 1500,
        payment_date: '2026-10-02',
        payment_method: 'card',
        card_id: 'card-1',
        wallet_id: null,
        note: 'First installment',
        status: 'completed',
        reversed_at: null,
        reversal_reason: null,
        created_at: '2026-10-02T10:00:00Z',
        card: { card_name: 'Main Debit' },
        wallet: null,
      },
    ])
  }),
  http.get('*/rest/v1/debt_charges*', () => {
    return HttpResponse.json([
      {
        id: 'charge-2',
        debt_id: 'debt-1',
        user_id: 'test-user-id',
        amount: 50,
        charge_date: '2026-10-05',
        note: 'Second purchase',
        status: 'active',
        voided_at: null,
        void_reason: null,
        created_at: '2026-10-05T09:00:00Z',
      },
      {
        id: 'charge-1',
        debt_id: 'debt-1',
        user_id: 'test-user-id',
        amount: 20,
        charge_date: '2026-10-04',
        note: null,
        status: 'active',
        voided_at: null,
        void_reason: null,
        created_at: '2026-10-04T09:00:00Z',
      },
    ])
  }),
  http.post('*/rest/v1/rpc/add_debt_charge_checked', () => {
    return HttpResponse.json(
      {
        id: 'charge-new-1',
        debt_id: 'debt-1',
        amount: 50,
        outstanding_amount: 70,
      },
      { status: 200 },
    )
  }),
  http.post('*/rest/v1/rpc/void_debt_charge_checked', () => {
    return HttpResponse.json(null, { status: 200 })
  }),
  http.post('*/rest/v1/rpc/create_debt_checked', () => {
    return HttpResponse.json({ id: 'debt-new-1' }, { status: 200 })
  }),
  http.post('*/rest/v1/rpc/update_debt_checked', () => {
    return HttpResponse.json(null, { status: 200 })
  }),
  http.post('*/rest/v1/rpc/archive_debt_checked', () => {
    return HttpResponse.json(null, { status: 200 })
  }),
  http.post('*/rest/v1/rpc/unarchive_debt_checked', () => {
    return HttpResponse.json(null, { status: 200 })
  }),
  http.post('*/rest/v1/rpc/pay_debt_checked', () => {
    return HttpResponse.json(
      {
        id: 'payment-new-1',
        debt_id: 'debt-1',
        amount: 1500,
        remaining_balance: 0,
        is_paid: true,
      },
      { status: 200 },
    )
  }),
  http.post('*/rest/v1/rpc/reverse_debt_payment_checked', () => {
    return HttpResponse.json(null, { status: 200 })
  }),
]
