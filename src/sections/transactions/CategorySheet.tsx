import { Check, Search } from 'lucide-react'
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'

import { ModalFrame, fieldInput, textMuted } from '@/components/ui'
import { isHexColor } from '@/sections/transactions/categoryColor'
import type { TransactionCategory } from '@/types'

const RECENT_LIMIT = 4
const SEARCH_THRESHOLD = 8

type CategorySheetProps = {
  categories: TransactionCategory[]
  onChoose: (categoryId: string) => void
  onClose: () => void
  /** Most recent first. */
  recentIds: string[]
  value: string
}

type Section = { categories: TransactionCategory[]; heading: string | null; key: string }

/**
 * Every category at once, for phones where the chip row only shows a few at a
 * time. Recent ones come first, then the rest in their usual order, and a
 * search narrows long lists. A tap chooses and closes: it is a single choice,
 * so there is nothing to confirm.
 *
 * The tiles are a listbox rather than a radio group because arrow keys only
 * move focus here; choosing also closes the sheet, so it must be deliberate.
 */
export function CategorySheet({
  categories,
  onChoose,
  onClose,
  recentIds,
  value,
}: CategorySheetProps) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const initialRef = useRef<HTMLButtonElement | null>(null)

  const trimmed = query.trim().toLowerCase()

  const sections = useMemo<Section[]>(() => {
    if (trimmed) {
      return [
        {
          categories: categories.filter((category) =>
            category.name.toLowerCase().includes(trimmed),
          ),
          heading: null,
          key: 'matches',
        },
      ]
    }

    const byId = new Map(categories.map((category) => [category.id, category]))
    const recent = recentIds
      .map((id) => byId.get(id))
      .filter((category): category is TransactionCategory => Boolean(category))
      .slice(0, RECENT_LIMIT)

    if (recent.length === 0) {
      return [{ categories, heading: null, key: 'all' }]
    }

    const recentSet = new Set(recent.map((category) => category.id))
    return [
      { categories: recent, heading: 'Recent', key: 'recent' },
      {
        categories: categories.filter((category) => !recentSet.has(category.id)),
        heading: 'More categories',
        key: 'all',
      },
    ].filter((section) => section.categories.length > 0)
  }, [categories, recentIds, trimmed])

  const flat = sections.flatMap((section) => section.categories)
  const selectedIndex = flat.findIndex((category) => category.id === value)
  const [focusId, setFocusId] = useState<string | null>(null)
  const rovingIndex = Math.max(
    0,
    focusId === null ? selectedIndex : flat.findIndex((category) => category.id === focusId),
  )

  const focusAt = (index: number) => {
    const target = flat[index]
    if (!target) return
    setFocusId(target.id)
    optionRefs.current[index]?.focus()
  }

  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = flat.length - 1
    // Two columns: left and right step one tile, up and down step a row.
    const next =
      event.key === 'ArrowRight'
        ? Math.min(index + 1, last)
        : event.key === 'ArrowLeft'
          ? Math.max(index - 1, 0)
          : event.key === 'ArrowDown'
            ? Math.min(index + 2, last)
            : event.key === 'ArrowUp'
              ? Math.max(index - 2, 0)
              : event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? last
                  : null
    if (next === null) return
    event.preventDefault()
    focusAt(next)
  }

  const kind = categories[0]?.type === 'income' ? 'income' : 'expense'
  const count = categories.length
  const showSearch = count > SEARCH_THRESHOLD
  const sectionStarts = sections.map((_, sectionIndex) =>
    sections.slice(0, sectionIndex).reduce((sum, section) => sum + section.categories.length, 0),
  )

  return (
    <ModalFrame
      mobilePresentation="sheet"
      closeLabel="Close category list"
      contentClassName="space-y-4 px-4 pb-4 md:px-6 md:pb-6"
      description={`${count} ${kind} ${count === 1 ? 'category' : 'categories'}`}
      headerClassName="px-4 pt-4 md:px-6 md:pt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_p]:text-sm [&_p]:font-medium [&_p]:text-slate-600 dark:[&_p]:text-slate-400"
      initialFocusRef={initialRef}
      onClose={onClose}
      overlayClassName="items-end p-0 [--modal-gutter:0px] md:items-center md:p-4 md:[--modal-gutter:1rem]"
      panelClassName="picker-sheet category-sheet font-geist rounded-b-none pb-[env(safe-area-inset-bottom)] shadow-wing-lg dark:shadow-none md:max-w-lg md:rounded-b-[2rem] md:pb-0"
      title="Choose category"
    >
      {showSearch ? (
        // The top padding keeps the focus ring clear of the scroll edge.
        <div className="relative pt-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-[calc(50%+2px)] left-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
            size={18}
          />
          <input
            type="search"
            aria-controls={listId}
            aria-label="Search categories"
            autoComplete="off"
            className={fieldInput(false, 'h-11 pl-11')}
            enterKeyHint="search"
            placeholder="Search categories"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setFocusId(null)
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' && flat.length > 0) {
                event.preventDefault()
                focusAt(0)
              }
            }}
          />
        </div>
      ) : null}

      {flat.length === 0 ? (
        <p className={`category-sheet-empty text-sm ${textMuted}`} role="status">
          No category matches “{query.trim()}”.
        </p>
      ) : (
        <div id={listId} role="listbox" aria-label="Categories" className="space-y-4">
          {sections.map((section, sectionIndex) => {
            const headingId = `${listId}-${section.key}`
            return (
              <div
                key={section.key}
                role="group"
                aria-labelledby={section.heading ? headingId : undefined}
                aria-label={section.heading ? undefined : trimmed ? 'Matches' : 'All categories'}
              >
                {section.heading ? (
                  <p id={headingId} className="category-sheet-heading">
                    {section.heading}
                  </p>
                ) : null}
                <div className="category-sheet-grid">
                  {section.categories.map((category, offset) => {
                    const index = sectionStarts[sectionIndex] + offset
                    const selected = category.id === value
                    return (
                      <button
                        key={category.id}
                        ref={(element) => {
                          optionRefs.current[index] = element
                          if (index === rovingIndex) initialRef.current = element
                        }}
                        type="button"
                        role="option"
                        aria-selected={selected}
                        tabIndex={index === rovingIndex ? 0 : -1}
                        className="category-sheet-tile"
                        onClick={() => onChoose(category.id)}
                        onFocus={() => setFocusId(category.id)}
                        onKeyDown={(event) => move(event, index)}
                      >
                        {selected ? (
                          <Check
                            aria-hidden="true"
                            className="txn-chip-check"
                            size={16}
                            strokeWidth={2.5}
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="txn-chip-dot"
                            style={
                              isHexColor(category.color) ? { background: category.color } : undefined
                            }
                          />
                        )}
                        <span className="min-w-0">{category.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </ModalFrame>
  )
}
