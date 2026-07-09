export function MonitoringSkeleton() {
  return (
    <div
      className="animate-pulse space-y-8 pb-20"
      aria-busy="true"
      aria-label="Loading budgets and goals"
    >
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded-full bg-pink-200 dark:bg-slate-700" />
          <div className="h-10 w-72 rounded-2xl bg-white dark:bg-slate-900" />
          <div className="h-4 w-96 max-w-full rounded-full bg-pink-100 dark:bg-slate-800" />
        </div>
        <div className="h-14 w-full rounded-[2rem] bg-pink-300 dark:bg-slate-700 md:w-48" />
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="flex h-32 items-center gap-4 rounded-[2rem] border border-pink-50 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-12 w-12 rounded-2xl bg-pink-100 dark:bg-slate-800" />
            <div className="flex-1 space-y-3">
              <div className="h-3 w-24 rounded-full bg-pink-100 dark:bg-slate-800" />
              <div className="h-7 w-20 rounded-full bg-pink-50 dark:bg-slate-950" />
              <div className="h-3 w-28 rounded-full bg-pink-50 dark:bg-slate-950" />
            </div>
          </div>
        ))}
      </section>

      <section className="flex h-24 items-center justify-between rounded-[2.5rem] border border-pink-50 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="h-14 w-64 rounded-[2rem] bg-pink-50 dark:bg-slate-950" />
        <div className="hidden h-3 w-28 rounded-full bg-pink-100 dark:bg-slate-800 sm:block" />
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-80 rounded-[2rem] border border-pink-50 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-8 flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-pink-100 dark:bg-slate-800" />
              <div className="flex-1 space-y-3">
                <div className="h-5 w-1/2 rounded-full bg-pink-100 dark:bg-slate-800" />
                <div className="h-3 w-1/3 rounded-full bg-pink-50 dark:bg-slate-950" />
              </div>
            </div>
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="h-20 rounded-2xl bg-pink-50 dark:bg-slate-950" />
              <div className="h-20 rounded-2xl bg-pink-50 dark:bg-slate-950" />
            </div>
            <div className="mb-5 h-3 rounded-full bg-pink-100 dark:bg-slate-800" />
            <div className="h-4 w-36 rounded-full bg-pink-50 dark:bg-slate-950" />
          </div>
        ))}
      </section>
    </div>
  )
}
