// Shared surface and text tokens for the authenticated app, matching the
// landing and auth language: 32px surfaces, 20px nested surfaces, slate
// neutrals and the brand-tinted `wing` shadow. Interactive controls are pills
// (see `AppButton` and `fieldStyles`).
//
// Text contrast: slate-600 on white is about 7.6:1, slate-400 on slate-900
// about 6.9:1.

export const surface =
  'rounded-[2rem] border border-pink-100 bg-white shadow-wing dark:border-slate-800 dark:bg-slate-900 dark:shadow-none'

export const surfaceNested =
  'rounded-[1.25rem] bg-pink-50/60 dark:bg-slate-800/60'

export const sectionTitle =
  'text-lg font-semibold tracking-tight text-slate-950 dark:text-white'

export const textMuted = 'text-slate-600 dark:text-slate-400'

// Money and counts: monospaced figures so columns line up.
export const figure = 'font-geist-mono tabular-nums'
