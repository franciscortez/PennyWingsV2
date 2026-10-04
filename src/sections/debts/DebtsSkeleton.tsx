import { surface, surfaceNested } from '@/components/ui/surfaces'

export function DebtsSkeleton() {
  return (
    <div className="space-y-8 animate-pulse" aria-busy="true" aria-label="Loading debts">
      {/* Summary strip skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className={`${surface} p-6`}>
            <div className="h-4 w-28 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="mt-4 h-8 w-36 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div className="mt-2 h-3 w-20 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Filter and tab skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-10 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
        <div className="h-10 w-48 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>

      {/* Cards grid skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className={`${surface} p-6`}>
            <div className="flex items-center justify-between">
              <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-6 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className="mt-6 space-y-2">
              <div className="h-4 w-32 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-7 w-40 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
            <div className={`mt-6 ${surfaceNested} h-2 w-full`} />
            <div className="mt-6 flex justify-end gap-2">
              <div className="h-9 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
