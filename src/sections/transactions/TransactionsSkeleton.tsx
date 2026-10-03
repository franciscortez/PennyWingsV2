import { surface } from '@/components/ui/surfaces'

export function TransactionsSkeleton() {
  return (
    <div className="activity-design space-y-6 lg:space-y-8" aria-busy="true" aria-label="Loading transactions">
      <h1 className="sr-only">Transaction History</h1>
      <div className="motion-safe:animate-pulse" aria-hidden="true">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="space-y-3">
            <div className="h-10 w-64 max-w-full rounded-full bg-pink-100 dark:bg-slate-800" />
            <div className="h-5 w-60 max-w-full rounded-full bg-pink-50 dark:bg-slate-800" />
          </div>
          <div className="h-12 w-48 rounded-full bg-pink-100 dark:bg-slate-800" />
        </header>
        <section className={`${surface} mt-6 space-y-4 p-5 sm:p-6 lg:mt-8`}>
          <div className="h-4 w-24 rounded-full bg-pink-100 dark:bg-slate-800" />
          <div className="h-12 rounded-full bg-pink-50 dark:bg-slate-800" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map(item => <div key={item} className="h-11 w-24 rounded-full bg-pink-50 dark:bg-slate-800" />)}
          </div>
        </section>
        <section className={`${surface} @container/ledger mt-6 lg:mt-8`}>
          <TransactionsLoadingRows />
        </section>
      </div>
    </div>
  )
}

export function TransactionsLoadingRows() {
  return (
    <div className="space-y-3 p-4 motion-safe:animate-pulse sm:p-5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map(item => (
        <div key={item} className="space-y-4 rounded-[1.25rem] bg-pink-50/60 p-4 dark:bg-slate-800/60 @min-[48rem]/ledger:flex @min-[48rem]/ledger:items-center @min-[48rem]/ledger:gap-5 @min-[48rem]/ledger:space-y-0">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-4 w-3/4 rounded-full bg-pink-100 dark:bg-slate-700" />
            <div className="h-3 w-1/2 rounded-full bg-pink-100 dark:bg-slate-700" />
          </div>
          <div className="ml-auto h-6 w-24 rounded-full bg-pink-100 dark:bg-slate-700" />
          <div className="h-11 w-24 rounded-full bg-pink-100 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  )
}
