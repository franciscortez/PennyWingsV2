import { surface, surfaceNested } from '@/components/ui/surfaces'

function Placeholder({ className = '' }: { className?: string }) {
  return <div className={`motion-safe:animate-pulse rounded-full bg-slate-200 dark:bg-slate-700 ${className}`} aria-hidden="true" />
}

export function AccountsSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8" aria-busy="true" aria-label="Loading accounts">
      <h1 className="sr-only">My Accounts</h1>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="w-full max-w-lg space-y-3">
          <Placeholder className="h-10 w-56 max-w-full" />
          <Placeholder className="h-5 w-full" />
        </div>
        <div className="flex flex-wrap gap-3">
          <Placeholder className="h-12 w-36" />
          <Placeholder className="h-12 w-36" />
        </div>
      </header>
      <section className="space-y-4">
        <article className={`${surface} space-y-6 p-5 sm:p-6 xl:p-8`}>
          <Placeholder className="h-5 w-36" />
          <Placeholder className="h-12 w-80 max-w-full" />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] gap-3">
            {Array.from({ length: 5 }, (_, index) => <div key={index} className={`${surfaceNested} p-4`}><Placeholder className="h-12" /></div>)}
          </div>
        </article>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <article key={index} className={`${surface} space-y-3 p-5`}><Placeholder className="h-5 w-24" /><Placeholder className="h-7 w-full" /></article>)}
        </div>
      </section>
      <section className={`${surface} flex flex-wrap gap-3 p-4`}>
        {Array.from({ length: 5 }, (_, index) => <Placeholder key={index} className="h-11 w-24" />)}
        <Placeholder className="h-12 w-80 max-w-full" />
      </section>
      <section className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-4">
        {Array.from({ length: 6 }, (_, index) => (
          <article key={index} className={`${surface} min-w-0 space-y-5 p-5`}>
            <Placeholder className="h-6 w-40 max-w-full" />
            <Placeholder className="aspect-[8/5] w-full rounded-[1.25rem]" />
            <Placeholder className="h-20 rounded-[1.25rem]" />
            <Placeholder className="h-11" />
          </article>
        ))}
      </section>
    </div>
  )
}
