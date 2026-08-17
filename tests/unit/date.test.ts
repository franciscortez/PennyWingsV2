import { describe, expect, it } from 'vitest'
import {
  currentMonthInput,
  formatDate,
  formatReportMonth,
  formatShortDate,
  getCurrentMonthRange,
  toDateInputValue,
  toReportMonth,
} from '@/lib/date'

describe('date utilities', () => {
  it('toDateInputValue returns YYYY-MM-DD format', () => {
    const d = new Date(2026, 7, 17) // August 17, 2026
    expect(toDateInputValue(d)).toBe('2026-08-17')
  })

  it('formatDate formats date correctly and handles invalid input', () => {
    expect(formatDate('2026-08-17')).toContain('Aug')
    expect(formatDate('2026-08-17')).toContain('2026')
    expect(formatDate(null)).toBe('No date')
    expect(formatDate('invalid-date')).toBe('No date')
  })

  it('formatShortDate formats day and month', () => {
    expect(formatShortDate('2026-08-17')).toContain('Aug')
    expect(formatShortDate(null)).toBe('No date')
  })

  it('currentMonthInput formats YYYY-MM', () => {
    const d = new Date(2026, 7, 17) // Month index 7 = August (08)
    expect(currentMonthInput(d)).toBe('2026-08')
  })

  it('toReportMonth appends first day of month', () => {
    expect(toReportMonth('2026-08')).toBe('2026-08-01')
  })

  it('formatReportMonth formats month and year in UTC', () => {
    expect(formatReportMonth('2026-08-01')).toBe('August 2026')
  })

  it('getCurrentMonthRange returns start and end of month', () => {
    const d = new Date(2026, 1, 15) // Feb 2026 (non-leap year)
    const range = getCurrentMonthRange(d)
    expect(range.start).toBe('2026-02-01')
    expect(range.end).toBe('2026-02-28')
  })
})
