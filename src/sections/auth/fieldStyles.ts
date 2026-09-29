import { twMerge } from 'tailwind-merge'

// Shared field styles for the auth forms. Labels, text, placeholder, border
// and error colors are chosen to pass WCAG AA on the paper background:
// slate-800 labels, slate-950 text, slate-500 placeholder (about 4.7:1),
// a slate-500 pill border for the 3:1 non-text minimum, and red-700 errors.

export const fieldLabel = 'text-sm font-medium text-slate-800'

export const fieldError = 'text-sm text-red-700'

export function fieldInput(hasError: boolean, className?: string) {
  return twMerge(
    'h-12 w-full rounded-full border bg-white px-5 text-base text-slate-950 transition-colors placeholder:text-slate-500 hover:border-slate-600 focus-visible:border-pink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-800',
    hasError ? 'border-red-700 hover:border-red-700' : 'border-slate-500',
    className,
  )
}
