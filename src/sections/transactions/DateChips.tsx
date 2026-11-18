import { fieldError, fieldLabel } from '@/components/ui'
import { toDateInputValue } from '@/lib/date'

type DateChipsProps = {
  error?: string
  errorId: string
  onChange: (value: string) => void
  value: string
}

const yesterdayValue = () => {
  const date = new Date()
  date.setDate(date.getDate() - 1)
  return toDateInputValue(date)
}

/**
 * Today and Yesterday as one-tap shortcuts, with the native date input as the
 * third pill for anything older. The input stays native so iOS and Android
 * keep their own pickers, and it is highlighted only for a custom date.
 */
export function DateChips({ error, errorId, onChange, value }: DateChipsProps) {
  const today = toDateInputValue()
  const yesterday = yesterdayValue()
  const custom = value !== today && value !== yesterday

  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor="transaction-date" className={`${fieldLabel} ml-1 block`}>
        Date
      </label>
      <div className="txn-date-row">
        {[
          { label: 'Today', date: today },
          { label: 'Yesterday', date: yesterday },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            className="txn-pill"
            aria-pressed={value === option.date}
            onClick={() => onChange(option.date)}
          >
            {option.label}
          </button>
        ))}
        <span className="txn-date-shell">
          <input
            aria-describedby={error ? errorId : undefined}
            aria-invalid={Boolean(error)}
            id="transaction-date"
            type="date"
            value={value}
            data-custom={custom ? 'true' : undefined}
            className="txn-date-input"
            onChange={(event) => onChange(event.target.value)}
          />
        </span>
      </div>
      {error ? (
        <p id={errorId} className={`ml-1 ${fieldError}`}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
