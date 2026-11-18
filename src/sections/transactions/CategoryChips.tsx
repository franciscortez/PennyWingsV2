import { Check } from 'lucide-react'
import { useMemo, useRef, type KeyboardEvent } from 'react'

import { fieldError, fieldLabel, textMuted } from '@/components/ui'
import type { TransactionCategory } from '@/types'

type CategoryChipsProps = {
  categories: TransactionCategory[]
  error?: string
  errorId: string
  onChange: (categoryId: string) => void
  /** Most recent first; anything not listed keeps the incoming order. */
  recentIds: string[]
  value: string
}

const isHexColor = (value: string | null): value is string =>
  value !== null && /^#[0-9a-f]{3,8}$/i.test(value)

/**
 * Categories as one-tap chips: a single scrolling row on phones, a wrapped
 * grid in the wide dialog. It is a radio group, so the row is one tab stop and
 * arrow keys move the choice. The chosen chip swaps its colour dot for a
 * check, so selection never relies on colour alone.
 */
export function CategoryChips({
  categories,
  error,
  errorId,
  onChange,
  recentIds,
  value,
}: CategoryChipsProps) {
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([])

  const ordered = useMemo(() => {
    const rank = new Map(recentIds.map((id, index) => [id, index]))
    return categories
      .map((category, index) => ({ category, index }))
      .sort((a, b) => {
        const rankA = rank.get(a.category.id) ?? Number.POSITIVE_INFINITY
        const rankB = rank.get(b.category.id) ?? Number.POSITIVE_INFINITY
        return rankA === rankB ? a.index - b.index : rankA - rankB
      })
      .map(({ category }) => category)
  }, [categories, recentIds])

  const selectedIndex = ordered.findIndex((category) => category.id === value)
  const focusIndex = selectedIndex === -1 ? 0 : selectedIndex

  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = ordered.length - 1
    let next: number | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = index === last ? 0 : index + 1
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = index === 0 ? last : index - 1
    } else if (event.key === 'Home') {
      next = 0
    } else if (event.key === 'End') {
      next = last
    }

    if (next === null) return
    event.preventDefault()
    onChange(ordered[next].id)
    chipRefs.current[next]?.focus()
  }

  return (
    <div className="min-w-0 space-y-2">
      <p id="transaction-category-label" className={`${fieldLabel} ml-1`}>
        Category
      </p>
      {ordered.length === 0 ? (
        <p className={`ml-1 text-sm ${textMuted}`}>
          No categories for this type yet.
        </p>
      ) : (
        <div
          role="radiogroup"
          aria-labelledby="transaction-category-label"
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          className="txn-chips"
          data-invalid={error ? 'true' : undefined}
        >
          {ordered.map((category, index) => {
            const checked = category.id === value
            return (
              <button
                key={category.id}
                ref={(element) => {
                  chipRefs.current[index] = element
                }}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={index === focusIndex ? 0 : -1}
                className="txn-chip"
                onClick={() => onChange(category.id)}
                onKeyDown={(event) => move(event, index)}
              >
                {checked ? (
                  <Check aria-hidden="true" className="txn-chip-check" size={16} strokeWidth={2.5} />
                ) : (
                  <span
                    aria-hidden="true"
                    className="txn-chip-dot"
                    style={isHexColor(category.color) ? { background: category.color } : undefined}
                  />
                )}
                <span className="txn-chip-label">{category.name}</span>
              </button>
            )
          })}
        </div>
      )}
      {error ? (
        <p id={errorId} className={`ml-1 ${fieldError}`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
