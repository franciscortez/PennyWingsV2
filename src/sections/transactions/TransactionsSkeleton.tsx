export function TransactionsSkeleton() {
  return (
    <div
      className="animate-pulse space-y-6 pb-20 sm:space-y-8"
      aria-busy="true"
      aria-label="Loading transactions"
    >
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2 sm:space-y-3">
          <div className="h-9 w-64 max-w-full rounded-2xl bg-white sm:h-11 sm:w-80 dark:bg-slate-900" />
          <div className="h-4 w-48 rounded-full bg-pink-100 sm:w-64 dark:bg-slate-800" />
        </div>
        <div className="h-12 w-full rounded-2xl bg-pink-300 sm:h-14 sm:w-56 sm:rounded-4xl dark:bg-slate-700" />
      </header>

      <section className="flex flex-col items-stretch gap-4 rounded-3xl border border-pink-50 bg-white p-4 sm:rounded-[2.5rem] sm:p-6 dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-2">
          <div className="ml-3 h-3 w-24 rounded-full bg-pink-100 sm:ml-4 dark:bg-slate-800" />
          <div className="h-12 rounded-2xl bg-pink-50 sm:h-14 sm:rounded-[1.5rem] dark:bg-slate-950" />
        </div>
        <div className="space-y-2">
          <div className="ml-3 h-3 w-20 rounded-full bg-pink-100 sm:ml-4 dark:bg-slate-800" />
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-11 w-20 shrink-0 rounded-xl bg-pink-50 sm:h-12 sm:w-24 sm:rounded-[1.2rem] dark:bg-slate-950"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-pink-50 bg-white sm:rounded-[3rem] dark:border-slate-800 dark:bg-slate-900">
        <div className="hidden h-16 border-b border-pink-100 bg-pink-50/60 md:block dark:border-slate-800 dark:bg-slate-950/40" />
        <div className="space-y-3 p-3 sm:space-y-4 sm:p-6">
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className="flex flex-col gap-3 rounded-2xl border border-pink-50 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:gap-5 md:rounded-[2rem] md:p-5"
            >
              <div className="flex items-center justify-between md:hidden">
                <div className="h-5 w-20 rounded-lg bg-pink-100 dark:bg-slate-800" />
                <div className="h-5 w-20 rounded-full bg-pink-100 dark:bg-slate-800" />
              </div>
              <div className="hidden h-12 w-12 shrink-0 rounded-2xl bg-pink-100 md:block dark:bg-slate-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded-full bg-pink-100 dark:bg-slate-800" />
                <div className="h-3 w-1/3 rounded-full bg-pink-50 dark:bg-slate-950" />
              </div>
              <div className="hidden h-8 w-24 rounded-xl bg-pink-50 lg:block dark:bg-slate-950" />
              <div className="hidden h-5 w-24 rounded-full bg-pink-100 md:block dark:bg-slate-800" />
              <div className="hidden gap-2 md:flex">
                <div className="h-9 w-9 rounded-xl bg-pink-50 dark:bg-slate-850" />
                <div className="h-9 w-9 rounded-xl bg-pink-50 dark:bg-slate-850" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
