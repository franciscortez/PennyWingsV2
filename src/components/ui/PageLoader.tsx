import { PennyWingsMark } from '@/sections/shared'

// The bounce and pulse loops stop under `prefers-reduced-motion: reduce`
// through the global override in `src/index.css`.
export function PageLoader({ forceLight = false }: { forceLight?: boolean }) {
  return (
    <main
      className={`flex min-h-svh flex-col items-center justify-center bg-paper p-4 font-geist ${
        forceLight ? '' : 'dark:bg-slate-950'
      }`}
      aria-label="Loading PennyWings"
    >
      <PennyWingsMark
        className="mb-6 h-28 w-40 animate-bounce"
      />
      <div className="flex items-center gap-2">
        <div
          className={`h-3 w-3 animate-pulse rounded-full bg-pink-300 ${
            forceLight ? '' : 'dark:bg-pink-400'
          }`}
          style={{ animationDelay: '0ms' }}
        />
        <div
          className={`h-3 w-3 animate-pulse rounded-full bg-pink-500 ${
            forceLight ? '' : 'dark:bg-pink-300'
          }`}
          style={{ animationDelay: '150ms' }}
        />
        <div
          className={`h-3 w-3 animate-pulse rounded-full bg-pink-700 ${
            forceLight ? '' : 'dark:bg-pink-200'
          }`}
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </main>
  )
}
