import { Check, ChevronRight } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'

import { fieldError, fieldLabel, textMuted } from '@/components/ui'
import { CategorySheet } from '@/sections/transactions/CategorySheet'
import { isHexColor } from '@/sections/transactions/categoryColor'
import type { TransactionCategory } from '@/types'

type CategoryChipsProps = {
  categories: TransactionCategory[]
  error?: string
  errorId: string
  onChange: (categoryId: string) => void
  /** Told when the "View all" sheet opens and closes, so the form can step aside. */
  onSheetOpenChange?: (open: boolean) => void
  /** Most recent first; anything not listed keeps the incoming order. */
  recentIds: string[]
  value: string
}

/** Below this the row fits a phone, so "View all" would add nothing. */
const VIEW_ALL_MIN = 4

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Centres a chip in its row without scrolling anything around it. */
const revealChip = (
  row: HTMLElement | null,
  chip: HTMLElement | null | undefined,
  smooth: boolean,
) => {
  if (!row || !chip) return
  // A chip wider than the row starts at its edge, so its check stays in view.
  const left =
    chip.offsetWidth >= row.clientWidth
      ? chip.offsetLeft - row.clientLeft - 3
      : chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2
  const target = Math.max(0, Math.min(left, row.scrollWidth - row.clientWidth))
  if (typeof row.scrollTo === 'function') {
    row.scrollTo({ left: target, behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto' })
  } else {
    row.scrollLeft = target
  }
}

/**
 * Categories as one-tap chips: a single scrolling row on phones, a wrapped
 * grid in the wide dialog. It is a radio group, so the row is one tab stop and
 * arrow keys move the choice. The chosen chip swaps its colour dot for a
 * check, so selection never relies on colour alone.
 *
 * On phones the row only shows a few chips at a time, so "View all" opens a
 * sheet with every category; the row then scrolls to whatever was chosen.
 */
export function CategoryChips({
  categories,
  error,
  errorId,
  onChange,
  onSheetOpenChange,
  recentIds,
  value,
}: CategoryChipsProps) {
  const chipRefs = useRef<Array<HTMLButtonElement | null>>([])
  const rowRef = useRef<HTMLDivElement>(null)
  const viewAllRef = useRef<HTMLButtonElement>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const wasOpenRef = useRef(false)
  const onSheetOpenChangeRef = useRef(onSheetOpenChange)

  useEffect(() => {
    onSheetOpenChangeRef.current = onSheetOpenChange
  })

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

  const selectedIndexRef = useRef(selectedIndex)
  useLayoutEffect(() => {
    selectedIndexRef.current = selectedIndex
  })

  // Editing an entry: start the row at its category, not at the first chip.
  useLayoutEffect(() => {
    const index = selectedIndexRef.current
    if (index > 0) revealChip(rowRef.current, chipRefs.current[index], false)
  }, [])

  // The form hid itself while the sheet was open and only shows itself again
  // on its next render, so focus on "View all" may be refused at first. Try at
  // once, then again on the next frame, and bring the chosen chip into view.
  useEffect(() => {
    onSheetOpenChangeRef.current?.(sheetOpen)
    let frame = 0
    if (wasOpenRef.current && !sheetOpen) {
      viewAllRef.current?.focus()
      frame = requestAnimationFrame(() => {
        if (document.activeElement !== viewAllRef.current) viewAllRef.current?.focus()
        const index = selectedIndexRef.current
        if (index >= 0) revealChip(rowRef.current, chipRefs.current[index], true)
      })
    }
    wasOpenRef.current = sheetOpen
    return () => cancelAnimationFrame(frame)
  }, [sheetOpen])

  // A form that unmounts mid-open must not stay hidden.
  useEffect(() => () => onSheetOpenChangeRef.current?.(false), [])

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
      <div className="flex min-h-6 items-center justify-between gap-3">
        <p id="transaction-category-label" className={`${fieldLabel} ml-1`}>
          Category
        </p>
        {ordered.length >= VIEW_ALL_MIN ? (
          <button
            ref={viewAllRef}
            type="button"
            className="txn-chips-all"
            aria-haspopup="dialog"
            aria-label={`View all ${ordered.length} categories`}
            onClick={() => setSheetOpen(true)}
          >
            View all <span className="tabular-nums">{ordered.length}</span>
            <ChevronRight aria-hidden="true" size={16} strokeWidth={2.25} />
          </button>
        ) : null}
      </div>
      {ordered.length === 0 ? (
        <p className={`ml-1 text-sm ${textMuted}`}>
          No categories for this type yet.
        </p>
      ) : (
        <div
          ref={rowRef}
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
      {sheetOpen ? (
        <CategorySheet
          categories={categories}
          recentIds={recentIds}
          value={value}
          onChoose={(categoryId) => {
            onChange(categoryId)
            setSheetOpen(false)
          }}
          onClose={() => setSheetOpen(false)}
        />
      ) : null}
    </div>
  )
}
