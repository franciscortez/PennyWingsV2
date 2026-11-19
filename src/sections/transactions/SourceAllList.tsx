import { Check, ChevronLeft, Search } from 'lucide-react'
import { useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'

import { fieldInput } from '@/components/ui/fieldStyles'
import { figure, textMuted } from '@/components/ui/surfaces'
import { AccountFace } from '@/sections/accounts/AccountFace'
import { getAccountKindLabel } from '@/sections/accounts/accountLabels'
import type { Account, FormPaymentMethod } from '@/types'

const SEARCH_THRESHOLD = 8

export type SourceListSection = {
  accounts: Account[]
  heading: string
  tab: FormPaymentMethod
}

type SourceAllListProps = {
  balanceFormatter: Intl.NumberFormat
  /** The account the carousel would use, when nothing is current yet. */
  fallbackKey: string | null
  /** `tab:accountId` of the account already chosen, if any. */
  currentKey: string | null
  onBack: () => void
  onChoose: (method: FormPaymentMethod, accountId: string) => void
  requiredAmount?: number
  sections: SourceListSection[]
}

const keyOf = (tab: FormPaymentMethod, account: Account) => `${tab}:${account.id}`

/**
 * Every account at once as a vertical stack of real card faces, grouped by
 * type, for when the carousel means too much swiping to compare accounts. A
 * tap chooses and closes: a single choice has nothing to confirm, so the list
 * is a listbox whose arrow keys only move focus.
 */
export function SourceAllList({
  balanceFormatter,
  currentKey,
  fallbackKey,
  onBack,
  onChoose,
  requiredAmount,
  sections,
}: SourceAllListProps) {
  const listId = useId()
  const [query, setQuery] = useState('')
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [focusKey, setFocusKey] = useState<string | null>(null)

  const trimmed = query.trim().toLowerCase()
  const total = sections.reduce((sum, section) => sum + section.accounts.length, 0)
  const showSearch = total > SEARCH_THRESHOLD

  const visible = useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          accounts: trimmed
            ? section.accounts.filter((account) => account.name.toLowerCase().includes(trimmed))
            : section.accounts,
        }))
        .filter((section) => section.accounts.length > 0),
    [sections, trimmed],
  )

  const flat = visible.flatMap((section) =>
    section.accounts.map((account) => ({ account, key: keyOf(section.tab, account), tab: section.tab })),
  )
  const startKey = currentKey ?? fallbackKey
  const startIndex = flat.findIndex((entry) => entry.key === startKey)
  const rovingIndex = Math.max(
    0,
    focusKey === null ? startIndex : flat.findIndex((entry) => entry.key === focusKey),
  )
  const sectionStarts = visible.map((_, sectionIndex) =>
    visible.slice(0, sectionIndex).reduce((sum, section) => sum + section.accounts.length, 0),
  )

  // Open on the chosen account, centred in view and focused, so the list never
  // starts at the top when the account you want is further down.
  useLayoutEffect(() => {
    const target = optionRefs.current[Math.max(0, startIndex)]
    if (!target) return
    target.scrollIntoView?.({ block: 'center' })
    target.focus({ preventScroll: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const focusAt = (index: number) => {
    const target = flat[index]
    if (!target) return
    setFocusKey(target.key)
    optionRefs.current[index]?.focus()
  }

  const move = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = flat.length - 1
    const next =
      event.key === 'ArrowDown'
        ? Math.min(index + 1, last)
        : event.key === 'ArrowUp'
          ? Math.max(index - 1, 0)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (next === null) return
    event.preventDefault()
    focusAt(next)
  }

  return (
    <div className="source-all">
      <button type="button" className="source-all-back" onClick={onBack}>
        <ChevronLeft aria-hidden="true" size={18} strokeWidth={2.25} />
        Back to carousel
      </button>

      {showSearch ? (
        <div className="relative pt-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-[calc(50%+2px)] left-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
            size={18}
          />
          <input
            type="search"
            aria-controls={listId}
            aria-label="Search accounts"
            autoComplete="off"
            className={fieldInput(false, 'h-11 pl-11')}
            enterKeyHint="search"
            placeholder="Search accounts"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setFocusKey(null)
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
        <p className={`source-all-empty text-sm ${textMuted}`} role="status">
          No account matches “{query.trim()}”.
        </p>
      ) : (
        <div id={listId} role="listbox" aria-label="All accounts" className="space-y-5">
          {visible.map((section, sectionIndex) => {
            const headingId = `${listId}-${section.tab}`
            return (
              <div key={section.tab} role="group" aria-labelledby={headingId}>
                <p id={headingId} className="category-sheet-heading">
                  {section.heading}
                </p>
                <div className="space-y-4">
                  {section.accounts.map((account, offset) => {
                    const index = sectionStarts[sectionIndex] + offset
                    const key = keyOf(section.tab, account)
                    const current = key === currentKey
                    const shortBy =
                      requiredAmount !== undefined &&
                      requiredAmount > 0 &&
                      account.balance < requiredAmount
                        ? requiredAmount - account.balance
                        : null
                    const short = shortBy !== null
                    return (
                      <button
                        key={key}
                        ref={(element) => {
                          optionRefs.current[index] = element
                        }}
                        type="button"
                        role="option"
                        aria-selected={current}
                        aria-label={[
                          account.name,
                          getAccountKindLabel(account),
                          balanceFormatter.format(account.balance),
                          current ? 'current' : null,
                          short ? 'not enough balance' : null,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                        tabIndex={index === rovingIndex ? 0 : -1}
                        className="source-all-item"
                        onClick={() => onChoose(section.tab, section.tab === 'cash' ? '' : account.id)}
                        onFocus={() => setFocusKey(key)}
                        onKeyDown={(event) => move(event, index)}
                      >
                        <span className="source-all-face" data-current={current ? 'true' : undefined}>
                          <AccountFace account={account} />
                        </span>
                        <span className="source-all-meta">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                              {account.name}
                            </span>
                            <span className={`flex items-center gap-1.5 text-xs ${textMuted}`}>
                              {getAccountKindLabel(account)}
                              {current ? (
                                <span className="source-current">
                                  <Check aria-hidden="true" size={12} strokeWidth={3} />
                                  Current
                                </span>
                              ) : null}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span
                              className={`block text-sm font-semibold ${figure} ${
                                short
                                  ? 'text-red-700 dark:text-red-300'
                                  : 'text-slate-950 dark:text-slate-100'
                              }`}
                            >
                              {balanceFormatter.format(account.balance)}
                            </span>
                            {shortBy !== null ? (
                              <span className="block text-xs font-medium text-red-700 dark:text-red-300">
                                Short by {balanceFormatter.format(shortBy)}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
