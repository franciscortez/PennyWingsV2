// Peso formatters and the category bar palette. These live in `lib` rather
// than under `sections/reports` because the daily spending calendar renders on
// both `/reports` and `/dashboard`, and a shared section must not depend on a
// feature folder.

export const reportCurrency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

export const compactReportCurrency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  maximumFractionDigits: 0,
  style: 'currency',
})

// Calendar cells are roughly 36px wide at 320px, where even the compact
// formatter's "PHP 1,240" overflows. Compact notation keeps the amount visible
// on mobile instead of hiding it behind the `aria-label` alone.
export const microReportCurrency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  maximumFractionDigits: 1,
  notation: 'compact',
  style: 'currency',
})

// Shared by the category allocation bars and the calendar's day detail split,
// so a category keeps the same colour wherever it is charted.
export const categoryBarColors = [
  'bg-pink-500',
  'bg-rose-400',
  'bg-amber-400',
  'bg-violet-400',
  'bg-emerald-400',
  'bg-sky-400',
]
