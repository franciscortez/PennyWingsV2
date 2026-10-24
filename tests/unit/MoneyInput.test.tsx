import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { MoneyInput } from '@/components/ui/MoneyInput'
import { formatMoneyInput, parseMoneyInput } from '@/lib/moneyInput'

function Field({ initial = '' }: { initial?: string }) {
  const [value, setValue] = useState(initial)
  return <><MoneyInput aria-label="Amount" value={value} onValueChange={setValue} /><output data-testid="raw">{value}</output></>
}

describe('money input', () => {
  it.each([
    ['', ''], ['22222', '22,222'], ['2222222', '2,222,222'],
    ['22222.50', '22,222.50'], ['22222.', '22,222.'], ['0.05', '0.05'],
    ['-1234.00', '-1,234.00'], ['.5', '.5'], ['-', '-'],
    ['12345678901234567890.123', '12,345,678,901,234,567,890.123'],
  ])('formats %s without rounding or losing unfinished decimals', (raw, formatted) => {
    expect(formatMoneyInput(raw)).toBe(formatted)
    expect(parseMoneyInput(formatted)).toBe(raw)
  })

  it.each(['1e3', '12abc', '1.2.3', 'Infinity', '1-2'])('rejects invalid input %s instead of changing its amount', value => {
    expect(parseMoneyInput(value)).toBeNull()
  })

  it('groups while typing, preserves cents, and emits only the raw value', async () => {
    const user = userEvent.setup()
    render(<Field />)
    const input = screen.getByRole('textbox', { name: 'Amount' })
    await user.type(input, '22222.50')
    expect(input).toHaveValue('22,222.50')
    expect(screen.getByTestId('raw')).toHaveTextContent('22222.50')
    await user.clear(input)
    expect(input).toHaveValue('')
    expect(screen.getByTestId('raw')).toBeEmptyDOMElement()
    await user.paste('2,222,222.25')
    expect(input).toHaveValue('2,222,222.25')
    expect(screen.getByTestId('raw')).toHaveTextContent('2222222.25')
  })

  it('keeps the cursor while editing and deletes digits across a comma', async () => {
    const user = userEvent.setup()
    render(<Field initial="12345" />)
    const input = screen.getByRole('textbox', { name: 'Amount' }) as HTMLInputElement
    await user.click(input)
    input.setSelectionRange(1, 1)
    await user.keyboard('9')
    expect(input).toHaveValue('192,345')
    expect(input.selectionStart).toBe(2)
    input.setSelectionRange(4, 4)
    await user.keyboard('{Backspace}')
    expect(input).toHaveValue('19,345')
    expect(input.selectionStart).toBe(2)
    await user.keyboard('{Delete}')
    expect(input).toHaveValue('1,945')
  })

  it('rejects malformed paste and reflects external presets', () => {
    const { rerender } = render(<MoneyInput aria-label="Amount" value="1234.50" onValueChange={() => undefined} />)
    const input = screen.getByRole('textbox', { name: 'Amount' })
    fireEvent.change(input, { target: { value: '12oops34' } })
    expect(input).toHaveValue('1,234.50')
    rerender(<MoneyInput aria-label="Amount" value="2500" onValueChange={() => undefined} />)
    expect(input).toHaveValue('2,500')
  })
})
