import { surface } from '@/components/ui/surfaces'

export function MonitoringSkeleton() {
  return <div className="min-w-0 space-y-8 pb-20" aria-busy="true" aria-label="Loading monitoring">
    <h1 className="sr-only">Budgets & Goals</h1>
    <div className="space-y-8 motion-safe:animate-pulse" aria-hidden="true">
      <div className="flex flex-wrap justify-between gap-4"><div className="h-10 w-64 max-w-full rounded-full bg-slate-200 dark:bg-slate-700" /><div className="h-12 w-44 max-w-full rounded-full bg-slate-200 dark:bg-slate-700" /></div>
      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map(item => <div key={item} className={`${surface} h-36 p-5`}><div className="h-5 w-1/2 rounded-full bg-slate-200 dark:bg-slate-700" /><div className="mt-4 h-8 w-2/3 rounded-full bg-slate-100 dark:bg-slate-800" /></div>)}</div>
      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">{[1,2].map(item => <div key={item} className={`${surface} h-80 p-5`}><div className="h-6 w-1/2 rounded-full bg-slate-200 dark:bg-slate-700" /><div className="mt-8 h-24 rounded-[1.25rem] bg-slate-100 dark:bg-slate-800" /></div>)}</div>
    </div>
  </div>
}
