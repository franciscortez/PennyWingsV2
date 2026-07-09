const skeletonCards = [1, 2, 3]

export function DashboardSkeleton() {
  return (
    <div
      className="animate-pulse space-y-10"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded-full bg-pink-200 dark:bg-slate-700" />
          <div className="h-10 w-64 max-w-full rounded-2xl bg-white dark:bg-slate-900" />
          <div className="h-4 w-80 max-w-full rounded-full bg-pink-100 dark:bg-slate-800" />
        </div>
        <div className="h-20 w-full rounded-3xl border border-pink-100 bg-white dark:border-slate-800 dark:bg-slate-900 md:w-52" />
      </header>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="relative min-h-96 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-pink-300 to-pink-400 p-8 dark:from-pink-900/60 dark:to-pink-950/80 lg:col-span-2">
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="relative space-y-10">
            <div className="h-14 w-52 rounded-2xl bg-white/30" />
            <div className="h-16 w-3/4 rounded-3xl bg-white/35" />
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="h-20 rounded-2xl bg-white/20" />
              <div className="h-20 rounded-2xl bg-white/20" />
            </div>
          </div>
        </div>
        <div className="rounded-[2.5rem] border border-pink-50 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-8 h-7 w-36 rounded-full bg-pink-100 dark:bg-slate-800" />
          <div className="mb-6 h-28 rounded-3xl bg-pink-50 dark:bg-slate-950" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-28 rounded-[2rem] bg-pink-50 dark:bg-slate-950" />
            <div className="h-28 rounded-[2rem] bg-pink-50 dark:bg-slate-950" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {[1, 2].map((item) => (
          <div
            key={item}
            className="h-48 rounded-[2.5rem] border border-pink-50 bg-white p-8 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-8 h-7 w-44 rounded-full bg-pink-100 dark:bg-slate-800" />
            <div className="mb-5 h-4 w-2/3 rounded-full bg-pink-50 dark:bg-slate-950" />
            <div className="h-3 rounded-full bg-pink-100 dark:bg-slate-800" />
          </div>
        ))}
      </section>

      <section className="rounded-[2.5rem] border border-pink-50 bg-white p-6 sm:p-10 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 h-8 w-52 rounded-full bg-pink-100 dark:bg-slate-800" />
        <div className="space-y-4">
          {skeletonCards.map((item) => (
            <div
              key={item}
              className="flex h-24 items-center gap-4 rounded-[2rem] border border-pink-50 p-4 dark:border-slate-800"
            >
              <div className="h-12 w-12 shrink-0 rounded-2xl bg-pink-100 dark:bg-slate-800" />
              <div className="flex-1 space-y-3">
                <div className="h-4 w-1/2 rounded-full bg-pink-100 dark:bg-slate-800" />
                <div className="h-3 w-1/3 rounded-full bg-pink-50 dark:bg-slate-950" />
              </div>
              <div className="h-5 w-24 rounded-full bg-pink-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
