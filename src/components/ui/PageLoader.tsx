import { PennyWingsMark } from '@/sections/shared'

export function PageLoader() {
  return (
    <main
      className="flex min-h-svh flex-col items-center justify-center bg-pink-50 p-4 dark:bg-slate-950"
      aria-label="Loading PennyWings"
    >
      <PennyWingsMark className="mb-6 h-24 w-24 animate-bounce text-pink-500 dark:text-pink-400" />
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 animate-pulse rounded-full bg-pink-400 dark:bg-pink-500"
          style={{ animationDelay: '0ms' }}
        />
        <div
          className="h-3 w-3 animate-pulse rounded-full bg-pink-500 dark:bg-pink-400"
          style={{ animationDelay: '150ms' }}
        />
        <div
          className="h-3 w-3 animate-pulse rounded-full bg-pink-600 dark:bg-pink-300"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </main>
  )
}
