// Scoped presentation for the remaining app pages. Shared modal behavior stays
// in ModalFrame; these classes change only the callers that opt in.
export const appModalPanel =
  'app-design-modal font-geist rounded-[2rem] shadow-wing-lg dark:shadow-none focus-visible:ring-pink-800 dark:focus-visible:ring-pink-300 [&_h2]:font-semibold [&_h2]:tracking-tighter [&_h2]:text-slate-950 dark:[&_h2]:text-white [&_.modal-header_p]:font-normal [&_.modal-header_p]:text-slate-600 dark:[&_.modal-header_p]:text-slate-400 [&_.modal-header_p]:break-words [&_.modal-header>button]:h-[44px] [&_.modal-header>button]:w-[44px] [&_.modal-header]:items-start [&_.modal-header]:gap-3 [&_.modal-header]:px-4 [&_.modal-body]:px-4 [&_.modal-actions]:px-4 [&_.modal-header>button]:text-slate-600 dark:[&_.modal-header>button]:text-slate-300 [&_.modal-header>button]:focus-visible:outline-2 [&_.modal-header>button]:focus-visible:outline-offset-2 [&_.modal-header>button]:focus-visible:outline-pink-800 dark:[&_.modal-header>button]:focus-visible:outline-pink-300 motion-reduce:[&_button]:transform-none motion-reduce:[&_button]:transition-none'

export const appChoice =
  'inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-full px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-800 dark:focus-visible:outline-pink-300 motion-reduce:transition-none'
export const appChoiceActive = 'bg-pink-700 text-white'
export const appChoiceIdle =
  'bg-pink-50 text-slate-700 hover:bg-pink-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
