import { ReceiptText, Target, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router'

import type { DashboardProgress } from '@/types/dashboard'

type ProgressOverviewSectionProps = {
  progress: DashboardProgress
}

export function ProgressOverviewSection({
  progress,
}: ProgressOverviewSectionProps) {
  return (
    <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
      <ProgressCard
        icon={ReceiptText}
        label="Manage"
        title="Budget Status"
        description="Monitor your category spending limits."
        progress={progress.budget}
        suffix="USED"
        to="/monitoring?tab=budgets"
      />
      <ProgressCard
        icon={Target}
        label="View All"
        title="Savings Goals"
        description="Track progress toward your financial dreams."
        progress={progress.goals}
        suffix="REACHED"
        to="/monitoring?tab=goals"
        accent="emerald"
      />
    </section>
  )
}

function ProgressCard({
  accent = 'pink',
  description,
  icon: Icon,
  label,
  progress,
  suffix,
  title,
  to,
}: {
  accent?: 'pink' | 'emerald'
  description: string
  icon: LucideIcon
  label: string
  progress: number
  suffix: string
  title: string
  to: string
}) {
  const fillClass =
    accent === 'emerald'
      ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
      : 'bg-pink-500'

  return (
    <Link to={to} className="group block">
      <article className="rounded-[2.5rem] border border-pink-50 bg-white p-8 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-100/70 dark:border-slate-800 dark:bg-slate-900 dark:hover:shadow-none">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xl font-black tracking-tight text-gray-900 dark:text-slate-100">
            <Icon className="h-6 w-6 text-pink-500 dark:text-pink-400" aria-hidden="true" />
            {title}
          </h3>
          <span className="rounded-full bg-pink-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-pink-500 transition group-hover:bg-pink-500 group-hover:text-white dark:bg-slate-800 dark:text-pink-400 dark:group-hover:bg-pink-500 dark:group-hover:text-white">
            {label}
          </span>
        </div>
        <p className="mb-4 text-sm font-bold italic text-gray-400 dark:text-slate-500">
          {description}
        </p>
        <div className="flex items-center gap-4">
          <div className="h-3 flex-1 overflow-hidden rounded-full border border-pink-100 bg-pink-50 dark:border-slate-850 dark:bg-slate-950">
            <div
              className={`h-full rounded-full transition-all duration-500 ${fillClass}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-black tracking-tight text-gray-800 dark:text-slate-350">
            {progress}% {suffix}
          </span>
        </div>
      </article>
    </Link>
  )
}
