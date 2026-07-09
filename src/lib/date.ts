type DateInput = Date | string | null | undefined

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/

const parseDate = (value: DateInput) => {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    return value
  }

  return new Date(dateOnlyPattern.test(value) ? `${value}T00:00:00` : value)
}

export const toDateInputValue = (date = new Date()) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')

export const formatDate = (
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  },
  fallback = 'No date',
  locale = 'en-US',
) => {
  const date = parseDate(value)

  if (!date || Number.isNaN(date.getTime())) {
    return fallback
  }

  return date.toLocaleDateString(locale, options)
}

export const formatShortDate = (value: DateInput, fallback = 'No date') =>
  formatDate(
    value,
    {
      day: 'numeric',
      month: 'short',
    },
    fallback,
  )

export const formatLongDate = (value: DateInput, fallback = 'No date') =>
  formatDate(
    value,
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
    fallback,
  )

export const formatTime = (
  value: DateInput,
  fallback = 'No time',
  locale = 'en-US',
) => {
  const date = parseDate(value)

  if (!date || Number.isNaN(date.getTime())) {
    return fallback
  }

  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    hour12: true,
    minute: '2-digit',
  })
}

export const formatDateTime = (
  value: DateInput,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
  },
  fallback = 'No date',
  locale = 'en-PH',
) => {
  const date = parseDate(value)

  if (!date || Number.isNaN(date.getTime())) {
    return fallback
  }

  return new Intl.DateTimeFormat(locale, options).format(date)
}

export const currentMonthInput = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

export const toReportMonth = (monthInput: string) => `${monthInput}-01`

export const formatReportMonth = (value: string) =>
  new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${value.slice(0, 7)}-01T00:00:00Z`))

export const getCurrentMonthRange = (date = new Date()) => ({
  end: toDateInputValue(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  start: toDateInputValue(new Date(date.getFullYear(), date.getMonth(), 1)),
})
