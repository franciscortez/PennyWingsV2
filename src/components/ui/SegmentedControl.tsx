import { useRef, type CSSProperties, type KeyboardEvent } from 'react'
import { twMerge } from 'tailwind-merge'

export type SegmentedOption<TValue extends string> = {
  label: string
  value: TValue
}

type SegmentedControlProps<TValue extends string> = {
  className?: string
  label: string
  onChange: (value: TValue) => void
  options: ReadonlyArray<SegmentedOption<TValue>>
  value: TValue
}

/**
 * Single-choice pill track with a sliding thumb. It is a radio group: one tab
 * stop, arrow keys (and Home, End or a digit) move the choice, and the thumb
 * follows by transform only so the slide stays on the compositor.
 */
export function SegmentedControl<TValue extends string>({
  className,
  label,
  onChange,
  options,
  value,
}: SegmentedControlProps<TValue>) {
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )

  const select = (index: number) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    optionRefs.current[index]?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1
    const digit = Number(event.key)

    let next: number | null = null
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = selectedIndex === last ? 0 : selectedIndex + 1
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = selectedIndex === 0 ? last : selectedIndex - 1
    } else if (event.key === 'Home') {
      next = 0
    } else if (event.key === 'End') {
      next = last
    } else if (Number.isInteger(digit) && digit >= 1 && digit <= options.length) {
      next = digit - 1
    }

    if (next === null) return
    event.preventDefault()
    select(next)
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={twMerge('segmented', className)}
      style={
        {
          '--segment-count': options.length,
          '--segment-index': selectedIndex,
        } as CSSProperties
      }
    >
      <span className="segmented-thumb" aria-hidden="true" />
      {options.map((option, index) => {
        const checked = index === selectedIndex
        return (
          <button
            key={option.value}
            ref={(element) => {
              optionRefs.current[index] = element
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            className="segmented-option"
            onClick={() => onChange(option.value)}
            onKeyDown={handleKeyDown}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
