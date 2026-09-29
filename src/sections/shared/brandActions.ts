// Shared action styles for the public brand surfaces (landing and auth).
//
// One label per intent across those surfaces: "Start free" always signs up,
// "Sign in" always logs in. Interactive elements are full pills; surfaces use
// 32px corners and nested surfaces 20px.

export const primaryAction =
  'inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-pink-700 px-6 font-semibold text-white shadow-wing transition-[background-color,transform] duration-200 hover:bg-pink-800 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-800'

export const secondaryAction =
  'inline-flex h-12 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-pink-200 bg-white px-6 font-semibold text-pink-900 transition-[background-color,border-color,transform] duration-200 hover:border-pink-300 hover:bg-pink-50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-800'

// Disabled treatment for action buttons inside forms. Kept separate so the
// landing's links never carry form-only state styles.
export const actionDisabled =
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100'

// Inline text link on white or paper: pink-800 on white is about 6.9:1.
export const textLink =
  'rounded-sm font-semibold text-pink-800 underline decoration-pink-300 underline-offset-4 transition-colors hover:text-pink-900 hover:decoration-pink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-800'
