export function AccountsSkeleton() {
  return (
    <div
      className="animate-pulse space-y-6 pb-20 sm:space-y-8"
      aria-busy="true"
      aria-label="Loading accounts"
    >
      <header className="flex flex-col gap-5 rounded-[2rem] border border-pink-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-3 w-24 rounded-full bg-pink-100 dark:bg-slate-800" />
          <div className="h-10 w-56 max-w-full rounded-2xl bg-pink-50 dark:bg-slate-800" />
          <div className="h-4 w-[32rem] max-w-full rounded-full bg-pink-100/70 dark:bg-slate-800/70" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-12 rounded-2xl bg-pink-100 dark:bg-slate-800 sm:w-28"
            />
          ))}
        </div>
      </header>

      <section className="space-y-4">
        <article className="relative min-h-44 overflow-hidden rounded-[2rem] bg-pink-300 p-5 dark:bg-pink-900/60 sm:p-6 lg:p-8">
          <div className="absolute inset-0 bg-white/10" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0 space-y-4">
              <div className="h-3 w-36 rounded-full bg-white/35" />
              <div className="h-12 w-80 max-w-full rounded-3xl bg-white/35 sm:h-14" />
              <div className="h-4 w-96 max-w-full rounded-full bg-white/25" />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:w-[34rem]">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-16 rounded-2xl border border-white/20 bg-white/15"
                />
              ))}
            </div>
          </div>
        </article>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <article
              key={item}
              className="min-h-32 rounded-[2rem] border border-pink-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="grid h-full grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-pink-100 dark:bg-slate-800" />
                <div className="min-w-0 space-y-3">
                  <div className="h-3 w-20 rounded-full bg-pink-100 dark:bg-slate-800" />
                  <div className="h-6 w-32 max-w-full rounded-full bg-pink-50 dark:bg-slate-950" />
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>

      <section className="rounded-[2rem] border border-pink-100 bg-white/95 p-3 shadow-sm shadow-pink-100/50 dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-none">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:w-auto">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="h-12 rounded-2xl bg-pink-50 dark:bg-slate-950 sm:w-28"
              />
            ))}
          </div>
          <div className="h-12 w-full rounded-2xl bg-pink-50 dark:bg-slate-950 xl:w-80" />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <article
            key={item}
            className="min-h-72 overflow-hidden rounded-[2rem] border border-pink-100 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="h-36 bg-pink-100 dark:bg-slate-800" />
            <div className="space-y-5 p-5">
              <div className="h-20 rounded-2xl bg-pink-50 dark:bg-slate-950" />
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="h-3 w-24 rounded-full bg-pink-100 dark:bg-slate-800" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-10 w-10 rounded-xl bg-pink-50 dark:bg-slate-800" />
                  <div className="h-10 w-10 rounded-xl bg-pink-50 dark:bg-slate-800" />
                  <div className="h-10 w-10 rounded-xl bg-pink-50 dark:bg-slate-800" />
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
