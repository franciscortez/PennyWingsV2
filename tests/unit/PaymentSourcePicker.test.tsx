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
const cash: Account = { ...base, id: 'cash-1', kind: 'cash', accountType: 'cash', name: 'Cash on Hand', balance: 0 }
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

  it('opens on the current account with its tab and card checked', async () => {
    const { user } = renderPicker({ cardId: 'card-2', method: 'card' })
    const sheet = await openSheet(user)

    expect(within(sheet).getByRole('radio', { name: 'Cards 2' })).toHaveAttribute('aria-checked', 'true')
    expect(within(sheet).getByRole('radio', { name: /^BPI Credit/ })).toHaveAttribute('aria-checked', 'true')
    expect(within(sheet).getByRole('radio', { name: /^BPI Credit/ })).toHaveAccessibleName(/current/)
    expect(within(sheet).getByText('Current')).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: 'Use BPI Credit' })).toBeEnabled()
  })

  it('lists the account types as tabs', async () => {
    const { user } = renderPicker()
    const sheet = await openSheet(user)

    const tabs = within(sheet).getByRole('radiogroup', { name: 'Account type' })
    expect(within(tabs).getAllByRole('radio').map((tab) => tab.textContent)).toEqual([
      'Cash',
      'Cards 2',
      'Wallets 1',
    ])
  })

  it('chooses cash with the Use button and closes', async () => {
    const { onChange, user } = renderPicker({ method: 'card', cardId: 'card-1' })
    const sheet = await openSheet(user)

    await user.click(within(sheet).getByRole('radio', { name: 'Cash' }))
    await user.click(within(sheet).getByRole('button', { name: 'Use Cash on Hand' }))

    expect(onChange).toHaveBeenCalledWith('cash', '')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('brings a side card to the centre first, then uses it', async () => {
    const { onChange, user } = renderPicker()
    const sheet = await openSheet(user)
    await user.click(within(sheet).getByRole('radio', { name: 'Cards 2' }))

    await user.click(within(sheet).getByRole('radio', { name: /^BPI Credit/ }))
    expect(onChange).not.toHaveBeenCalled()
    expect(within(sheet).getByRole('radio', { name: /^BPI Credit/ })).toHaveAttribute('aria-checked', 'true')

    await user.click(within(sheet).getByRole('button', { name: 'Use BPI Credit' }))
    expect(onChange).toHaveBeenCalledWith('card', 'card-2')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('uses the centred card when it is tapped', async () => {
    const { onChange, user } = renderPicker()
    const sheet = await openSheet(user)
    await user.click(within(sheet).getByRole('radio', { name: 'Cards 2' }))

    await user.click(within(sheet).getByRole('radio', { name: /^BDO Debit/ }))

    expect(onChange).toHaveBeenCalledWith('card', 'card-1')
  })

  it('moves between cards with the arrow keys and confirms with Enter', async () => {
    const { onChange, user } = renderPicker({ cardId: 'card-1', method: 'card' })
    const sheet = await openSheet(user)
    within(sheet).getByRole('radio', { name: /^BDO Debit/ }).focus()

    await user.keyboard('{ArrowRight}')
    const bpi = within(sheet).getByRole('radio', { name: /^BPI Credit/ })
    expect(bpi).toHaveFocus()
    expect(bpi).toHaveAttribute('aria-checked', 'true')

    await user.keyboard('{Home}')
    expect(within(sheet).getByRole('radio', { name: /^BDO Debit/ })).toHaveFocus()
    await user.keyboard('{End}{Enter}')

    expect(onChange).toHaveBeenCalledWith('card', 'card-2')
  })

  it('selects an e-wallet account', async () => {
    const { onChange, user } = renderPicker()
    const sheet = await openSheet(user)

    await user.click(within(sheet).getByRole('radio', { name: 'Wallets 1' }))
    await user.click(within(sheet).getByRole('button', { name: 'Use GCash' }))

    expect(onChange).toHaveBeenCalledWith('ewallet', 'wallet-1')
  })

  it('hides cash when it is not allowed', async () => {
    const { user } = renderPicker({ allowCash: false, method: 'card' })
    const sheet = await openSheet(user)

    expect(within(sheet).queryByRole('radio', { name: 'Cash' })).not.toBeInTheDocument()
  })

  it('offers lent accounts when allowed', async () => {
    const { onChange, user } = renderPicker({ allowLent: true })
    const sheet = await openSheet(user)

    await user.click(within(sheet).getByRole('radio', { name: 'Lent 1' }))
    await user.click(within(sheet).getByRole('button', { name: 'Use Lent to Ana' }))

    expect(onChange).toHaveBeenCalledWith('lent', 'lent-1')
  })

  it('explains an empty tab and has nothing to use', async () => {
    const { user } = renderPicker({ walletAccounts: [] })
    const sheet = await openSheet(user)

    await user.click(within(sheet).getByRole('radio', { name: 'Wallets 0' }))

    expect(within(sheet).getByText('No e-wallets yet. Add one in Accounts.')).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: 'Nothing to choose' })).toBeDisabled()
  })

  it('opens on a tab with accounts when the current method has none', async () => {
    const { user } = renderPicker({ cashAccount: null })
    const sheet = await openSheet(user)

    expect(within(sheet).getByRole('radio', { name: 'Cards 2' })).toHaveAttribute('aria-checked', 'true')
  })

  it('leaves out excluded accounts such as the source of a transfer', async () => {
    const { user } = renderPicker({ excludeCardId: 'card-1', label: 'To Account', method: 'card' })
    const sheet = await openSheet(user, 'To Account')

    expect(within(sheet).getByRole('radio', { name: 'Cards 1' })).toBeInTheDocument()
    expect(within(sheet).queryByRole('radio', { name: /^BDO Debit/ })).not.toBeInTheDocument()
    expect(within(sheet).getByRole('radio', { name: /^BPI Credit/ })).toBeInTheDocument()
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

  it('does not mark any account as current while unselected', async () => {
    const { user } = renderPicker({ unselected: true, label: 'Source Account' })
    const sheet = await openSheet(user, 'Source Account')

    expect(within(sheet).queryByText('Current')).not.toBeInTheDocument()
    expect(within(sheet).getByRole('radio', { name: /^Cash on Hand/ })).not.toHaveAccessibleName(/current/)
  })

  it('flags accounts that cannot cover the required amount', async () => {
    const { user } = renderPicker({ requiredAmount: 1000, cardAccounts: [base, otherCard] })
    const sheet = await openSheet(user)

    expect(sheet).toHaveTextContent('Amount ₱1,000.00')
    expect(within(sheet).getByText('Short by ₱1,000.00')).toBeInTheDocument()
    expect(within(sheet).getByRole('button', { name: 'Use Cash on Hand anyway' })).toBeEnabled()

    await user.click(within(sheet).getByRole('radio', { name: 'Cards 2' }))
    expect(within(sheet).getByRole('radio', { name: /^BDO Debit/ })).not.toHaveAccessibleName(/not enough balance/)
    expect(within(sheet).getByRole('radio', { name: /^BPI Credit/ })).toHaveAccessibleName(/not enough balance/)
    expect(within(sheet).queryByText(/Short by/)).not.toBeInTheDocument()

    await user.click(within(sheet).getByRole('radio', { name: /^BPI Credit/ }))
    expect(within(sheet).getByText('Short by ₱920.00')).toBeInTheDocument()
  })

  describe('View all', () => {
    const openAll = async (user: ReturnType<typeof userEvent.setup>, sheet: HTMLElement) => {
      await user.click(within(sheet).getByRole('button', { name: /^View all/ }))
      return within(sheet).getByRole('listbox', { name: 'All accounts' })
    }

    it('lists every account grouped by type and picks one on tap', async () => {
      const { onChange, user } = renderPicker({ allowLent: true })
      const sheet = await openSheet(user)
      expect(within(sheet).getByRole('button', { name: 'View all 5 accounts' })).toBeInTheDocument()

      const list = await openAll(user, sheet)
      expect(within(list).getAllByRole('group').map((group) => group.textContent?.split('₱')[0])).toEqual([
        expect.stringContaining('Cash'),
        expect.stringContaining('Bank cards'),
        expect.stringContaining('E-wallets'),
        expect.stringContaining('Lent'),
      ])
      expect(within(list).getAllByRole('option')).toHaveLength(5)
      expect(within(sheet).queryByRole('button', { name: /^Use / })).not.toBeInTheDocument()

      await user.click(within(list).getByRole('option', { name: /^BPI Credit/ }))

      expect(onChange).toHaveBeenCalledWith('card', 'card-2')
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('chooses cash with an empty account id', async () => {
      const { onChange, user } = renderPicker({ method: 'card', cardId: 'card-1' })
      const list = await openAll(user, await openSheet(user))

      await user.click(within(list).getByRole('option', { name: /^Cash on Hand/ }))

      expect(onChange).toHaveBeenCalledWith('cash', '')
    })

    it('marks the current account and focuses it', async () => {
      const { user } = renderPicker({ cardId: 'card-2', method: 'card' })
      const list = await openAll(user, await openSheet(user))

      const current = within(list).getByRole('option', { name: /^BPI Credit/ })
      expect(current).toHaveAttribute('aria-selected', 'true')
      expect(current).toHaveAccessibleName(/current/)
      expect(current).toHaveFocus()
      expect(within(list).getByRole('option', { name: /^BDO Debit/ })).toHaveAttribute('aria-selected', 'false')
    })

    it('moves focus with the arrow keys and picks with Enter', async () => {
      const { onChange, user } = renderPicker({ cardId: 'card-1', method: 'card' })
      const list = await openAll(user, await openSheet(user))

      await user.keyboard('{ArrowDown}')
      expect(within(list).getByRole('option', { name: /^BPI Credit/ })).toHaveFocus()
      await user.keyboard('{End}')
      expect(within(list).getByRole('option', { name: /^GCash/ })).toHaveFocus()
      await user.keyboard('{Enter}')

      expect(onChange).toHaveBeenCalledWith('ewallet', 'wallet-1')
    })

    it('leaves out excluded accounts', async () => {
      const { user } = renderPicker({ excludeCardId: 'card-1', method: 'card' })
      const list = await openAll(user, await openSheet(user))

      expect(within(list).queryByRole('option', { name: /^BDO Debit/ })).not.toBeInTheDocument()
      expect(within(list).getAllByRole('option')).toHaveLength(3)
    })

    it('flags accounts that cannot cover the amount but keeps them selectable', async () => {
      const { onChange, user } = renderPicker({ requiredAmount: 1000, method: 'card', cardId: 'card-1' })
      const list = await openAll(user, await openSheet(user))

      expect(within(list).getByRole('option', { name: /^BDO Debit/ })).not.toHaveAccessibleName(/not enough/)
      const short = within(list).getByRole('option', { name: /^BPI Credit/ })
      expect(short).toHaveAccessibleName(/not enough balance/)
      expect(short).toHaveTextContent('Short by ₱920.00')

      await user.click(short)
      expect(onChange).toHaveBeenCalledWith('card', 'card-2')
    })

    it('goes back to the carousel on the same tab with focus on View all', async () => {
      const { onChange, user } = renderPicker({ cardId: 'card-2', method: 'card' })
      const sheet = await openSheet(user)
      await openAll(user, sheet)

      await user.click(within(sheet).getByRole('button', { name: 'Back to carousel' }))

      expect(within(sheet).queryByRole('listbox')).not.toBeInTheDocument()
      expect(within(sheet).getByRole('radio', { name: 'Cards 2' })).toHaveAttribute('aria-checked', 'true')
      expect(within(sheet).getByRole('button', { name: 'Use BPI Credit' })).toBeEnabled()
      await vi.waitFor(() => expect(within(sheet).getByRole('button', { name: /^View all/ })).toHaveFocus())
      expect(onChange).not.toHaveBeenCalled()
    })

    it('hides View all when there are fewer than three accounts', async () => {
      const { user } = renderPicker({
        cardAccounts: [base],
        cashAccount: null,
        lentAccounts: [],
        walletAccounts: [gcash],
      })
      const sheet = await openSheet(user)

      expect(within(sheet).queryByRole('button', { name: /^View all/ })).not.toBeInTheDocument()
    })

    it('searches once the list is long', async () => {
      const extra = Array.from({ length: 7 }, (_, i): Account => ({
        ...base, id: `card-x${i}`, name: `Extra ${i}`,
      }))
      const { user } = renderPicker({ cardAccounts: [base, otherCard, ...extra] })
      const sheet = await openSheet(user)
      const list = await openAll(user, sheet)
      expect(within(list).getAllByRole('option').length).toBeGreaterThan(8)

      await user.type(within(sheet).getByRole('searchbox', { name: 'Search accounts' }), 'bpi')
      expect(within(sheet).getAllByRole('option')).toHaveLength(1)

      await user.clear(within(sheet).getByRole('searchbox'))
      await user.type(within(sheet).getByRole('searchbox'), 'zzz')
      expect(within(sheet).getByRole('status')).toHaveTextContent('No account matches')
    })
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

describe('PaymentSourcePicker provider logos', () => {
  const bpi: Account = { ...base, id: 'card-bpi', name: 'BPI', accountType: 'savings', color: '#9E1014' }
  const xmas: Account = { ...base, id: 'card-x', name: 'Christmas Present', color: '#F472B6' }
  const wise: Account = { ...base, id: 'card-w', name: 'Wise', color: '#3B82F6' }
  const uno: Account = { ...base, id: 'card-u', name: 'UNO Savings', color: '#6C4BD3' }
  const lentBpi: Account = { ...lent, id: 'lent-b', name: 'Lent to BPI' }
  const cards = [bpi, xmas, wise, uno]

  const imgsIn = (element: HTMLElement) => Array.from(element.querySelectorAll('img'))

  it('shows the logo on the tile for a selected card', () => {
    renderPicker({ cardAccounts: cards, cardId: 'card-bpi', method: 'card' })

    const [logo] = imgsIn(screen.getByRole('button', { name: /Payment Method/ }))
    expect(logo).toHaveAttribute('data-logo', 'bpi')
  })

  it('puts light-on-white logos on a dark chip', () => {
    const maya: Account = { ...gcash, id: 'wallet-maya', accountType: 'maya', name: 'Maya' }
    renderPicker({ method: 'ewallet', walletAccounts: [maya], walletId: 'wallet-maya' })

    const [logo] = imgsIn(screen.getByRole('button', { name: /Payment Method/ }))
    expect(logo).toHaveAttribute('data-logo', 'maya')
    expect(logo?.parentElement).toHaveClass('bg-slate-900')
  })

  it('puts the white GoTyme logo on a dark chip', () => {
    const gotyme: Account = { ...base, id: 'card-go', name: 'GoSave (Invesment)', color: '#071D2B' }
    renderPicker({ cardAccounts: [gotyme], cardId: 'card-go', method: 'card' })

    const [logo] = imgsIn(screen.getByRole('button', { name: /Payment Method/ }))
    expect(logo).toHaveAttribute('data-logo', 'gotyme')
    expect(logo?.parentElement).toHaveClass('bg-slate-900')
  })

  it('keeps the generic icon on the tile for an unbranded card, at the logo width', () => {
    renderPicker({ cardAccounts: cards, cardId: 'card-x', method: 'card' })

    const tile = screen.getByRole('button', { name: /Payment Method/ })
    expect(imgsIn(tile)).toHaveLength(0)
    expect(tile.firstElementChild).toHaveClass('w-14')
  })

  it('loads the official PNG logo for Landbank', () => {
    const landbank: Account = { ...base, id: 'card-lb', name: 'Landbank', color: '#00702F' }
    renderPicker({ cardAccounts: [landbank], cardId: 'card-lb', method: 'card' })

    const [logo] = imgsIn(screen.getByRole('button', { name: /Payment Method/ }))
    expect(logo).toHaveAttribute('data-logo', 'landbank')
    expect(logo?.getAttribute('src')).toMatch(/png/i)
  })

  it('shows the real card face for each account in the sheet', async () => {
    const { user } = renderPicker({ cardAccounts: cards, method: 'card', cardId: 'card-bpi', allowLent: true, lentAccounts: [lentBpi] })
    const sheet = await openSheet(user)

    expect(within(sheet).getByRole('radio', { name: /^BPI,/ })).toHaveTextContent('BPI')
    await user.click(within(sheet).getByRole('radio', { name: 'Lent 1' }))
    expect(within(sheet).getByRole('radio', { name: /^Lent to BPI/ })).toHaveTextContent('Lent to BPI')
  })
})
