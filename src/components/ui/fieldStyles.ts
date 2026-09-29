import { twMerge } from 'tailwind-merge'

// Shared field styles for auth and app forms. Every pair passes WCAG AA on
// the paper background in light mode and on slate-900 in dark mode:
//   light: slate-800 labels, slate-950 text, slate-500 placeholder (about
//          4.7:1), a slate-500 border for the 3:1 non-text minimum, red-700
//          errors, pink-800 focus outline.
//   dark:  slate-200 labels, slate-100 text, slate-400 placeholder, a
//          slate-500 border, red-300 errors, pink-300 focus outline.
// Auth pages force light mode, so only the light values render there.

export const fieldLabel = 'text-sm font-medium text-slate-800 dark:text-slate-200'

export const fieldHint = 'text-sm text-slate-600 dark:text-slate-400'

export const fieldError = 'text-sm text-red-700 dark:text-red-300'

const fieldBase =
  'w-full border bg-white text-base text-slate-950 transition-colors placeholder:text-slate-500 hover:border-slate-600 focus-visible:border-pink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-400 dark:hover:border-slate-400 dark:focus-visible:border-pink-300 dark:focus-visible:outline-pink-300'

function fieldBorder(hasError: boolean) {
  return hasError
    ? 'border-red-700 hover:border-red-700 dark:border-red-300 dark:hover:border-red-300'
    : 'border-slate-500'
}

export function fieldInput(hasError: boolean, className?: string) {
  return twMerge(fieldBase, 'h-12 rounded-full px-5', fieldBorder(hasError), className)
}

export function fieldTextarea(hasError: boolean, className?: string) {
  return twMerge(
    fieldBase,
    'min-h-28 rounded-[1.25rem] px-5 py-3',
    fieldBorder(hasError),
    className,
  )
}
