export function ReportsSkeleton() {
  return (
    <div
      className="animate-pulse space-y-9 pb-20"
      aria-busy="true"
      aria-label="Loading financial reports"
    >
      <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-pink-200" />
            <div className="h-10 w-72 max-w-full rounded-2xl bg-white" />
          </div>
          <div className="h-4 w-80 max-w-full rounded-full bg-pink-100" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-44 rounded-full bg-emerald-100" />
          <div className="h-12 w-44 rounded-[1.5rem] bg-white" />
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="flex h-36 items-center gap-4 rounded-[2rem] border border-pink-50 bg-white p-5"
          >
            <div className="h-13 w-13 rounded-2xl bg-pink-100" />
            <div className="flex-1 space-y-3">
              <div className="h-3 w-20 rounded-full bg-pink-100" />
              <div className="h-7 w-28 rounded-full bg-pink-50" />
              <div className="h-3 w-24 rounded-full bg-pink-50" />
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-7 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-3">
          <div className="h-80 rounded-[2.5rem] border border-pink-50 bg-white p-8">
            <div className="mb-10 h-7 w-48 rounded-full bg-pink-100" />
            <div className="space-y-9">
              <div className="space-y-3">
                <div className="h-4 w-40 rounded-full bg-pink-50" />
                <div className="h-4 rounded-full bg-emerald-100" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-40 rounded-full bg-pink-50" />
                <div className="h-4 w-3/4 rounded-full bg-pink-100" />
              </div>
            </div>
          </div>
          <div className="h-60 rounded-[2.5rem] bg-gray-300" />
        </div>
        <div className="h-[35rem] rounded-[2.5rem] border border-pink-50 bg-white p-8 xl:col-span-2">
          <div className="mb-8 h-7 w-52 rounded-full bg-pink-100" />
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="space-y-3">
                <div className="h-4 w-2/3 rounded-full bg-pink-50" />
                <div className="h-3 rounded-full bg-pink-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="h-72 rounded-[2.5rem] border border-pink-50 bg-white p-8">
        <div className="mb-8 h-7 w-48 rounded-full bg-pink-100" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-20 rounded-2xl bg-pink-50" />
          ))}
        </div>
      </section>
    </div>
  )
}
