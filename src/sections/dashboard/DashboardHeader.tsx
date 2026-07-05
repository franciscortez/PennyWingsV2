export function DashboardHeader() {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-pink-500">
          Dashboard
        </p>
        <h1 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
          My PennyWings
        </h1>
        <p className="mt-2 max-w-2xl text-sm font-medium italic text-gray-500 sm:text-base">
          Every penny has wings, keep them flying in the right direction.
        </p>
      </div>
      <div className="rounded-3xl border border-pink-100 bg-white px-5 py-4 text-left md:text-right">
        <p className="text-xs font-black uppercase tracking-widest text-pink-400">
          Current Date
        </p>
        <p className="mt-1 text-lg font-black text-gray-800">
          {new Date().toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>
    </header>
  )
}
