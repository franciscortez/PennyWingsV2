import type { Ref } from 'react'

import { MoneyInput } from '@/components/ui/MoneyInput'
import { formatMoneyInput } from '@/lib/moneyInput'

type AmountHeroProps = {
  error?: string
  errorId: string
  inputRef?: Ref<HTMLInputElement>
  onValueChange: (value: string) => void
  value: string
}

/**
 * Steps the figure down as it grows so the longest amount still sits on one
 * line in a 320px sheet. Geist Mono keeps every character one `ch` wide.
 */
const amountSize = (length: number) => {
  if (length <= 6) return 'xl'
  if (length <= 9) return 'lg'
  if (length <= 12) return 'md'
  return 'sm'
}

/**
 * The amount as the form's headline: a large monospaced figure with the peso
 * sign hung beside it. It is still a real text input underneath, so typing,
 * pasting and assistive technology behave exactly as in any other field.
 */
export function AmountHero({
  error,
  errorId,
  inputRef,
  onValueChange,
  value,
}: AmountHeroProps) {
  const formatted = formatMoneyInput(value)
  const width = Math.max(formatted.length, 4) + 0.5

  return (
    <div className="txn-amount">
      <label
        className="txn-amount-field"
        data-invalid={error ? 'true' : undefined}
        data-size={amountSize(formatted.length)}
      >
        <span className="txn-amount-currency" aria-hidden="true">
          ₱
        </span>
        <MoneyInput
          ref={inputRef}
          aria-describedby={error ? errorId : undefined}
          aria-invalid={Boolean(error)}
          aria-label="Amount (PHP)"
          autoComplete="off"
          className="txn-amount-input"
          enterKeyHint="done"
          placeholder="0.00"
          style={{ width: `${width}ch` }}
          value={value}
          onValueChange={onValueChange}
        />
      </label>
      {error ? (
        <p id={errorId} className="txn-amount-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}
