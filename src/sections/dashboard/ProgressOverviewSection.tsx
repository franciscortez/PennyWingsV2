import { ReceiptText, Target, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'
import { figure, sectionTitle, surface, textMuted } from '@/components/ui/surfaces'
import type { DashboardProgress } from '@/types/dashboard'

type ProgressOverviewSectionProps = { progress: DashboardProgress }
export function ProgressOverviewSection({ progress }: ProgressOverviewSectionProps) {
  return <section aria-label="Financial progress" className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
    <ProgressCard icon={ReceiptText} label="Manage" title="Budget Status" description="Monitor your category spending limits." progress={progress.budget} suffix="USED" to="/monitoring?tab=budgets" />
    <ProgressCard icon={Target} label="View All" title="Savings Goals" description="Track progress toward your financial dreams." progress={progress.goals} suffix="REACHED" to="/monitoring?tab=goals" accent="emerald" />
  </section>
}
function ProgressCard({ accent = 'pink', description, icon: Icon, label, progress, suffix, title, to }: {
  accent?: 'pink' | 'emerald'; description: string; icon: LucideIcon; label: string; progress: number; suffix: string; title: string; to: string;
}) {
  return <Link to={to} className={`${surface} group block min-w-0 p-5 transition-[border-color] hover:border-pink-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-800 sm:p-6 dark:hover:border-pink-400 dark:focus-visible:outline-pink-300 motion-reduce:transition-none`}>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <h2 className={`${sectionTitle} flex items-center gap-2`}><Icon className="h-5 w-5 shrink-0 text-pink-700 dark:text-pink-400" aria-hidden="true" />{title}</h2>
      <span className="text-sm font-medium text-pink-700 group-hover:underline dark:text-pink-400">{label}</span>
    </div>
    <p className={`mb-6 text-sm leading-relaxed ${textMuted}`}>{description}</p>
    <div className="flex flex-wrap items-center gap-3">
      <div role="progressbar" aria-label={title} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-2 min-w-16 flex-1 overflow-hidden rounded-full bg-pink-100 dark:bg-slate-700">
        <div className={`h-full rounded-full ${accent === 'emerald' ? 'bg-emerald-700 dark:bg-emerald-400' : 'bg-pink-700 dark:bg-pink-400'}`} style={{ width: `${progress}%` }} />
      </div>
      <span className={`${figure} text-sm font-medium text-slate-950 dark:text-slate-100`}>{progress}% {suffix}</span>
    </div>
  </Link>
}
