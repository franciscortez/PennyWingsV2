import type { ComponentProps } from 'react'

import { formatMoneyInput, parseMoneyInput } from '@/lib/moneyInput'

type MoneyInputProps = Omit<ComponentProps<'input'>, 'value' | 'defaultValue' | 'onChange' | 'type' | 'inputMode' | 'min' | 'max' | 'step'> & {
  value: string
  onValueChange: (rawValue: string) => void
}

export function MoneyInput({ value, onValueChange, onKeyDown, ...props }: MoneyInputProps) {
  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      pattern="-?[0-9,]*([.][0-9]{0,2})?"
      value={formatMoneyInput(value)}
      onChange={event => {
        const input = event.currentTarget
        const raw = parseMoneyInput(input.value)
        if (raw === null) {
          input.value = formatMoneyInput(value)
          return
        }

        // Count digits/sign/decimal before the cursor, ignoring inserted separators.
        const offset = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/,/g, '').length
        const formatted = formatMoneyInput(raw)
        let caret = 0
        let characters = 0
        while (caret < formatted.length && characters < offset) {
          if (formatted[caret] !== ',') characters += 1
          caret += 1
        }
        input.value = formatted
        onValueChange(raw)
        input.setSelectionRange(caret, caret)
      }}
      onKeyDown={event => {
        onKeyDown?.(event)
        if (event.defaultPrevented) return
        const input = event.currentTarget
        const start = input.selectionStart
        if (start === null || start !== input.selectionEnd) return
        // Skip formatting punctuation so deletion removes a digit instead of getting stuck.
        if (event.key === 'Backspace' && input.value[start - 1] === ',') {
          input.setSelectionRange(start - 1, start - 1)
        } else if (event.key === 'Delete' && input.value[start] === ',') {
          input.setSelectionRange(start + 1, start + 1)
        }
      }}
    />
  )
}
