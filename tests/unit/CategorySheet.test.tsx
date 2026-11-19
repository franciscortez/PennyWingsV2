import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { CategoryChips } from '@/sections/transactions/CategoryChips'
import type { TransactionCategory } from '@/types'

const names = [
  'Bills', 'Coffee', 'Eating Out', 'Groceries', 'Health', 'Pets',
  'Rent', 'Shopping', 'Transport', 'Travel',
]

const categories: TransactionCategory[] = names.map((name, index) => ({
  color: '#F472B6',
  icon: null,
  id: `cat-${index}`,
  name,
  type: 'expense',
}))

type Props = Partial<Parameters<typeof CategoryChips>[0]>

function Harness({ onChange, ...props }: Props) {
  const [value, setValue] = useState(props.value ?? '')
  return (
    <CategoryChips
      categories={categories}
      errorId="category-error"
      recentIds={[]}
      {...props}
      value={value}
      onChange={(id) => {
        setValue(id)
        onChange?.(id)
      }}
    />
  )
}

const setup = (props: Props = {}) => {
  const onChange = vi.fn()
  const onSheetOpenChange = vi.fn()
  render(<Harness onChange={onChange} onSheetOpenChange={onSheetOpenChange} {...props} />)
  return { onChange, onSheetOpenChange, user: userEvent.setup() }
}

const viewAll = () => screen.getByRole('button', { name: 'View all 10 categories' })

describe('Category "View all" sheet', () => {
  it('labels the button with the category count', () => {
    setup()
    expect(viewAll()).toHaveTextContent('View all 10')
    expect(viewAll()).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('hides "View all" when only a few categories exist', () => {
    setup({ categories: categories.slice(0, 3) })
    expect(screen.queryByRole('button', { name: /View all/ })).not.toBeInTheDocument()
  })

  it('lists every category, recent ones first and not repeated', async () => {
    const { onSheetOpenChange, user } = setup({ recentIds: ['cat-8', 'cat-3'] })
    await user.click(viewAll())

    const dialog = screen.getByRole('dialog', { name: 'Choose category' })
    expect(dialog).toHaveTextContent('10 expense categories')
    expect(onSheetOpenChange).toHaveBeenLastCalledWith(true)

    const recent = within(dialog).getByRole('group', { name: 'Recent' })
    expect(within(recent).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Transport',
      'Groceries',
    ])

    const more = within(dialog).getByRole('group', { name: 'More categories' })
    expect(within(more).getAllByRole('option')).toHaveLength(8)
    expect(within(more).queryByRole('option', { name: 'Transport' })).not.toBeInTheDocument()
  })

  it('chooses a category, closes and returns focus to "View all"', async () => {
    const { onChange, onSheetOpenChange, user } = setup()
    await user.click(viewAll())
    await user.click(screen.getByRole('option', { name: 'Travel' }))

    expect(onChange).toHaveBeenCalledWith('cat-9')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onSheetOpenChange).toHaveBeenLastCalledWith(false)
    expect(screen.getByRole('radio', { name: 'Travel' })).toHaveAttribute('aria-checked', 'true')
    await waitFor(() => expect(viewAll()).toHaveFocus())
  })

  it('opens on the chosen category and marks it selected', async () => {
    const { user } = setup({ value: 'cat-5' })
    await user.click(viewAll())

    const pets = screen.getByRole('option', { name: 'Pets' })
    expect(pets).toHaveAttribute('aria-selected', 'true')
    await waitFor(() => expect(pets).toHaveFocus())
  })

  it('filters with search and shows an empty state', async () => {
    const { user } = setup()
    await user.click(viewAll())

    const search = screen.getByRole('searchbox', { name: 'Search categories' })
    await user.type(search, 'tr')
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Transport',
      'Travel',
    ])

    await user.clear(search)
    await user.type(search, 'zzz')
    expect(screen.queryByRole('option')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('No category matches “zzz”.')
  })

  it('leaves out search for short lists', async () => {
    const { user } = setup({ categories: categories.slice(0, 5) })
    await user.click(screen.getByRole('button', { name: 'View all 5 categories' }))
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('moves focus with arrow keys without choosing', async () => {
    const { onChange, user } = setup()
    await user.click(viewAll())
    await waitFor(() => expect(screen.getByRole('option', { name: 'Bills' })).toHaveFocus())

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('option', { name: 'Coffee' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('option', { name: 'Groceries' })).toHaveFocus()
    await user.keyboard('{End}')
    expect(screen.getByRole('option', { name: 'Travel' })).toHaveFocus()
    expect(onChange).not.toHaveBeenCalled()

    await user.keyboard('{Enter}')
    expect(onChange).toHaveBeenCalledWith('cat-9')
  })

  it('closes on Escape without changing the choice', async () => {
    const { onChange, user } = setup({ value: 'cat-1' })
    await user.click(viewAll())
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('radio', { name: 'Coffee' })).toHaveAttribute('aria-checked', 'true')
    await waitFor(() => expect(viewAll()).toHaveFocus())
  })
})
