export function TransactionsSkeleton() {
  return (
    <div
      className="animate-pulse space-y-8 pb-20"
      aria-busy="true"
      aria-label="Loading transactions"
    >
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-3">
          <div className="h-11 w-80 max-w-full rounded-2xl bg-white dark:bg-slate-900" />
          <div className="h-4 w-64 rounded-full bg-pink-100 dark:bg-slate-800" />
        </div>
        <div className="h-14 w-full rounded-[2rem] bg-pink-300 dark:bg-slate-700 md:w-56" />
      </header>

      <section className="flex flex-col gap-5 rounded-[2.5rem] border border-pink-50 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 lg:flex-row">
        <div className="flex-1 space-y-3">
          <div className="ml-4 h-3 w-24 rounded-full bg-pink-100 dark:bg-slate-800" />
          <div className="h-14 rounded-[1.5rem] bg-pink-50 dark:bg-slate-950" />
        </div>
        <div className="space-y-3">
          <div className="ml-4 h-3 w-20 rounded-full bg-pink-100 dark:bg-slate-800" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-14 w-20 rounded-[1.2rem] bg-pink-50 dark:bg-slate-950"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[3rem] border border-pink-50 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="hidden h-20 border-b border-pink-100 bg-pink-50/60 dark:border-slate-800 dark:bg-slate-950/40 md:block" />
        <div className="space-y-1 p-4 md:p-6">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="flex min-h-24 items-center gap-5 rounded-[2rem] border-b border-pink-50 p-4 dark:border-slate-800 md:px-6"
            >
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-pink-100 dark:bg-slate-800 md:hidden" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-1/2 rounded-full bg-pink-100 dark:bg-slate-800" />
                <div className="h-3 w-1/3 rounded-full bg-pink-50 dark:bg-slate-950" />
              </div>
              <div className="hidden h-9 w-28 rounded-xl bg-pink-50 dark:bg-slate-950 sm:block" />
              <div className="h-5 w-24 rounded-full bg-pink-100 dark:bg-slate-800" />
              <div className="hidden gap-2 md:flex">
                <div className="h-10 w-10 rounded-xl bg-pink-50 dark:bg-slate-850" />
                <div className="h-10 w-10 rounded-xl bg-pink-50 dark:bg-slate-850" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
