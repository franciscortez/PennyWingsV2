import { DashboardHeader } from '@/sections/dashboard/DashboardHeader'
import { surface, surfaceNested } from '@/components/ui/surfaces'

export function DashboardSkeleton() {
  return <div className="dashboard-design space-y-6 lg:space-y-8" aria-busy="true" aria-label="Loading dashboard">
    <DashboardHeader />
    <div className="space-y-6 motion-safe:animate-pulse lg:space-y-8" aria-hidden="true">
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="min-w-0 rounded-[2rem] bg-[linear-gradient(160deg,var(--color-pink-700),var(--color-pink-900))] p-5 shadow-wing-lg sm:p-8 lg:col-span-2">
          <div className="mb-6 h-6 w-40 max-w-full rounded-full bg-white/30" />
          <div className="mb-8 h-14 w-3/4 rounded-[1.25rem] bg-white/30" />
          <div className="grid gap-6 border-t border-white/30 pt-6 sm:grid-cols-2">
            {[1, 2].map(item => <div key={item} className="space-y-2"><div className="h-5 w-32 max-w-full rounded-full bg-white/30" /><div className="h-8 w-40 max-w-full rounded-full bg-white/30" /></div>)}
          </div>
        </div>
        <div className={`${surface} p-5 sm:p-6`}>
          <div className="mb-6 h-7 w-36 rounded-full bg-pink-100 dark:bg-slate-700" />
          <div className={`${surfaceNested} mb-6 h-24`} />
          <div className="grid gap-3 min-[360px]:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {[1, 2].map(item => <div key={item} className="h-12 rounded-full bg-pink-50 dark:bg-slate-800" />)}
          </div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
        {[1, 2].map(item => <div key={item} className={`${surface} p-5 sm:p-6`}>
          <div className="mb-3 h-6 w-44 max-w-full rounded-full bg-pink-100 dark:bg-slate-700" />
          <div className="mb-6 h-5 w-3/4 rounded-full bg-pink-50 dark:bg-slate-800" />
          <div className="h-4 rounded-full bg-pink-100 dark:bg-slate-700" />
        </div>)}
      </div>
      <div className={`${surface} p-4 sm:p-6 md:p-8`}>
        <div className="mb-6 h-12 w-48 max-w-full rounded-[1.25rem] bg-pink-100 dark:bg-slate-700" />
        <div className="mb-6 grid gap-3 sm:grid-cols-3">{[1, 2, 3].map(item => <div key={item} className={`${surfaceNested} h-24`} />)}</div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">{Array.from({ length: 42 }, (_, cell) => <div key={cell} className="min-h-12 rounded-xl bg-pink-50 sm:min-h-16 dark:bg-slate-800" />)}</div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map(item => <div key={item} className={`${surface} h-24`} />)}</div>
    </div>
  </div>
}
