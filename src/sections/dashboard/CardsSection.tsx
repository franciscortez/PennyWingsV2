import { Building2, Clock, CreditCard, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import { AppButton } from '@/components/ui/Button'
import { FormattedFigure } from '@/components/ui/FormattedFigure'
import { figure, sectionTitle, surface, surfaceNested, textMuted } from '@/components/ui/surfaces'
import type { DashboardMonthlyStats } from '@/types/dashboard'

type CardsSectionProps = { loading: boolean; monthlyStats: DashboardMonthlyStats; savingsRate: number; totalBalance: number }
const currency = new Intl.NumberFormat('en-PH', { currency: 'PHP', minimumFractionDigits: 2, style: 'currency' })
const compactCurrency = new Intl.NumberFormat('en-PH', { currency: 'PHP', maximumFractionDigits: 0, style: 'currency' })

export function CardsSection({ loading, monthlyStats, savingsRate, totalBalance }: CardsSectionProps) {
  return (
    <section aria-label="Financial overview" className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
      <article className="min-w-0 rounded-[2rem] bg-[linear-gradient(160deg,var(--color-pink-700),var(--color-pink-900))] p-5 text-white shadow-wing-lg sm:p-8 lg:col-span-2">
        <div className="mb-6 flex items-center gap-3">
          <Building2 className="h-5 w-5 shrink-0" aria-hidden="true" /><h2 className="text-base font-medium">Total Net Worth</h2>
        </div>
        <p data-dashboard-balance className="mb-8 min-w-0 text-[clamp(1.5rem,5vw,3.5rem)] font-semibold leading-tight tracking-[-0.03em]">
          <FormattedFigure value={loading ? 'Loading...' : currency.format(totalBalance)} />
        </p>
        <div className="grid gap-6 border-t border-white/30 pt-6 sm:grid-cols-2">
          <MoneyMetric icon={TrendingUp} iconSurface="bg-emerald-100 text-emerald-900" label="Monthly Income" loading={loading} value={monthlyStats.income} />
          <MoneyMetric icon={TrendingDown} iconSurface="bg-pink-100 text-pink-900" label="Monthly Expenses" loading={loading} value={monthlyStats.expenses} />
        </div>
      </article>
      <article className={`${surface} flex min-w-0 flex-col p-5 sm:p-6`}>
        <h2 className={`${sectionTitle} mb-6`}>Pulse Report</h2>
        <div className={`${surfaceNested} mb-6 p-4 sm:p-5`}>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <p className={`text-sm ${textMuted}`}>Savings Rate</p>
            <p className={`${figure} text-2xl font-semibold text-pink-800 dark:text-pink-400`}>{loading ? '...' : `${savingsRate}%`}</p>
          </div>
          <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-pink-100 dark:bg-slate-700">
            <div className="h-full rounded-full bg-pink-700 dark:bg-pink-400" style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }} />
          </div>
        </div>
        <div className="mt-auto grid gap-3 min-[360px]:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <AppButton to="/accounts" variant="secondary" className="min-w-0 transition-[border-color] gap-[8px] px-[8px] sm:px-4 motion-reduce:transform-none motion-reduce:transition-none"><CreditCard className="h-[16px] w-[16px] shrink-0" aria-hidden="true" />Accounts</AppButton>
          <AppButton to="/transactions" variant="secondary" className="min-w-0 transition-[border-color] gap-[8px] px-[8px] sm:px-4 motion-reduce:transform-none motion-reduce:transition-none"><Clock className="h-[16px] w-[16px] shrink-0" aria-hidden="true" />Activity</AppButton>
        </div>
      </article>
    </section>
  )
}

function MoneyMetric({ icon: Icon, iconSurface, label, loading, value }: { icon: LucideIcon; iconSurface: string; label: string; loading: boolean; value: number }) {
  return <div className="min-w-0">
    <div className="mb-2 flex items-center gap-2"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${iconSurface}`}><Icon className="h-4 w-4" aria-hidden="true" /></span><p className="text-sm font-medium">{label}</p></div>
    <p className="text-2xl font-semibold leading-tight"><FormattedFigure value={loading ? 'Loading...' : compactCurrency.format(value)} /></p>
  </div>
}
