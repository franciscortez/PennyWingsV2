export function AccountsSkeleton() {
  return (
    <div
      className="animate-pulse pb-20"
      aria-busy="true"
      aria-label="Loading accounts"
    >
      <header className="mb-8 space-y-3">
        <div className="h-10 w-56 rounded-2xl bg-white dark:bg-slate-900" />
        <div className="h-4 w-80 max-w-full rounded-full bg-pink-100 dark:bg-slate-800" />
      </header>

      <section className="relative mb-10 min-h-60 overflow-hidden rounded-[3rem] bg-gradient-to-br from-pink-300 to-pink-400 p-8 dark:from-pink-900/60 dark:to-pink-950/80 md:p-12">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="relative flex min-h-36 flex-col items-center justify-between gap-8 md:flex-row">
          <div className="w-full space-y-4 md:w-1/2">
            <div className="h-3 w-32 rounded-full bg-white/35" />
            <div className="h-14 w-72 max-w-full rounded-3xl bg-white/35" />
          </div>
          <div className="h-16 w-full rounded-[2rem] bg-white/45 md:w-56" />
        </div>
      </section>

      <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="flex h-24 items-center gap-4 rounded-[2rem] border border-pink-50 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-12 w-12 rounded-2xl bg-pink-100 dark:bg-slate-800" />
            <div className="flex-1 space-y-3">
              <div className="h-3 w-20 rounded-full bg-pink-100 dark:bg-slate-800" />
              <div className="h-5 w-28 rounded-full bg-pink-50 dark:bg-slate-950" />
            </div>
          </div>
        ))}
      </section>

      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row">
        <div className="h-14 w-full rounded-[2rem] bg-pink-100/70 dark:bg-slate-800/70 md:w-[32rem]" />
        <div className="h-14 w-full rounded-2xl bg-white dark:bg-slate-900 md:w-64" />
      </div>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="overflow-hidden rounded-[2rem] border border-pink-50 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-32 bg-gradient-to-br from-pink-200 to-pink-100 dark:from-slate-800 dark:to-slate-850" />
            <div className="space-y-4 p-5">
              <div className="h-16 rounded-2xl bg-pink-50 dark:bg-slate-950" />
              <div className="flex items-center justify-between">
                <div className="h-3 w-20 rounded-full bg-pink-100 dark:bg-slate-800" />
                <div className="flex gap-2">
                  <div className="h-9 w-9 rounded-xl bg-pink-50 dark:bg-slate-850" />
                  <div className="h-9 w-9 rounded-xl bg-pink-50 dark:bg-slate-850" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  )
}
