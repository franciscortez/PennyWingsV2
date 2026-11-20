import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DebtCard } from '@/sections/debts/DebtCard'
import type { Debt } from '@/types'

const debt: Debt = {
  id: 'debt-1',
  userId: 'user-1',
  providerName: 'Atome',
  debtType: 'bnpl',
  originalAmount: 5000,
  outstandingAmount: 2000,
  dueDate: null,
  note: null,
  status: 'outstanding',
  paidAt: null,
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
}

const renderCard = (overrides: Partial<Parameters<typeof DebtCard>[0]> = {}) => {
  const handlers = { onArchive: vi.fn(), onEdit: vi.fn(), onHistory: vi.fn(), onPay: vi.fn() }

  render(<DebtCard debt={debt} {...handlers} {...overrides} />)

  return { ...handlers, trigger: screen.queryByRole('button', { name: 'Debt actions' }) }
}

describe('DebtCard actions menu', () => {
  it('exposes menu semantics on the trigger', async () => {
    const user = userEvent.setup()
    const { trigger } = renderCard()

    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).not.toHaveAttribute('aria-controls')

    await user.click(trigger!)

    const menu = screen.getByRole('menu', { name: 'Debt actions' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger).toHaveAttribute('aria-controls', menu.id)
  })

  it('focuses the first item on open and moves with the arrow keys, wrapping', async () => {
    const user = userEvent.setup()
    const { trigger } = renderCard()

    await user.click(trigger!)

    const [edit, archive] = screen.getAllByRole('menuitem')
    expect(edit).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(archive).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(edit).toHaveFocus()

    await user.keyboard('{ArrowUp}')
    expect(archive).toHaveFocus()

    await user.keyboard('{Home}')
    expect(edit).toHaveFocus()

    await user.keyboard('{End}')
    expect(archive).toHaveFocus()
  })

  it('opens from the trigger with ArrowDown', async () => {
    const user = userEvent.setup()
    const { trigger } = renderCard()

    trigger!.focus()
    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getAllByRole('menuitem')[0]).toHaveFocus()
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    const { trigger } = renderCard()

    await user.click(trigger!)
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })

  it('closes on an outside press but not on a press inside the menu', async () => {
    const user = userEvent.setup()
    const { trigger } = renderCard()

    await user.click(trigger!)
    await user.pointer({ keys: '[MouseLeft>]', target: screen.getByRole('menu') })
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.click(document.body)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes on Tab so focus continues to the next control', async () => {
    const user = userEvent.setup()
    const { trigger } = renderCard()

    await user.click(trigger!)
    await user.tab()

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('runs the chosen action and closes the menu', async () => {
    const user = userEvent.setup()
    const { onArchive, trigger } = renderCard()

    await user.click(trigger!)
    await user.click(screen.getByRole('menuitem', { name: 'Archive' }))

    expect(onArchive).toHaveBeenCalledWith(debt)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('offers Restore for archived debts', async () => {
    const user = userEvent.setup()
    const onUnarchive = vi.fn()
    const { trigger } = renderCard({
      debt: { ...debt, status: 'archived' },
      onArchive: undefined,
      onEdit: undefined,
      onUnarchive,
    })

    await user.click(trigger!)
    await user.click(screen.getByRole('menuitem', { name: 'Restore' }))

    expect(onUnarchive).toHaveBeenCalled()
  })

  it('does not render an empty menu', () => {
    const { trigger } = renderCard({ onArchive: undefined, onEdit: undefined })

    expect(trigger).toBeNull()
  })
})
