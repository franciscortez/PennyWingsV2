import {
  Building2,
  Clock,
  CreditCard,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { Link } from 'react-router'

import type { DashboardMonthlyStats } from '@/types/dashboard'

type CardsSectionProps = {
  loading: boolean
  monthlyStats: DashboardMonthlyStats
  savingsRate: number
  totalBalance: number
}

const currency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

const compactCurrency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  maximumFractionDigits: 0,
  style: 'currency',
})

export function CardsSection({
  loading,
  monthlyStats,
  savingsRate,
  totalBalance,
}: CardsSectionProps) {
  return (
    <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <article className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-pink-500 to-pink-700 p-6 text-white sm:p-8 md:p-10 lg:col-span-2">
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-12 -translate-y-8 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-2xl border border-white/25 bg-white/20 p-3 backdrop-blur-sm">
              <Building2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 sm:text-sm">
              Total Net Worth
            </p>
          </div>
          <h2 className="mb-10 break-words text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            {loading ? 'Loading...' : currency.format(totalBalance)}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <MoneyMetric
              icon={TrendingUp}
              iconClassName="text-emerald-200"
              label="Monthly Income"
              loading={loading}
              value={monthlyStats.income}
            />
            <MoneyMetric
              icon={TrendingDown}
              iconClassName="text-pink-200"
              label="Monthly Expenses"
              loading={loading}
              value={monthlyStats.expenses}
            />
          </div>
        </div>
      </article>

      <article className="flex flex-col rounded-[2.5rem] border border-pink-50 bg-white p-6 sm:p-8">
        <h3 className="mb-6 flex items-center gap-2 text-xl font-black text-gray-800">
          <span className="h-8 w-2 rounded-full bg-pink-500" />
          Pulse Report
        </h3>
        <div className="flex-1 space-y-6">
          <div className="rounded-3xl border border-pink-100/70 bg-pink-50/60 p-5">
            <div className="mb-3 flex items-end justify-between">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                Savings Rate
              </p>
              <p className="text-lg font-black text-pink-600">
                {loading ? '...' : `${savingsRate}%`}
              </p>
            </div>
            <div className="h-3 overflow-hidden rounded-full border border-pink-100 bg-white">
              <div
                className="h-full rounded-full bg-pink-500 transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, savingsRate))}%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DashboardAction icon={CreditCard} label="Accounts" to="/accounts" />
            <DashboardAction icon={Clock} label="Activity" to="/transactions" />
          </div>
        </div>
      </article>
    </section>
  )
}

function MoneyMetric({
  icon: Icon,
  iconClassName,
  label,
  loading,
  value,
}: {
  icon: LucideIcon
  iconClassName: string
  label: string
  loading: boolean
  value: number
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2 opacity-85">
        <Icon className={`h-4 w-4 ${iconClassName}`} aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-3xl font-black">
        {loading ? 'Loading...' : compactCurrency.format(value)}
      </p>
    </div>
  )
}

function DashboardAction({
  icon: Icon,
  label,
  to,
}: {
  icon: LucideIcon
  label: string
  to: string
}) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-center justify-center gap-3 rounded-[2rem] border border-pink-100 bg-white p-6 transition hover:-translate-y-1"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-100 text-pink-600 transition group-hover:bg-pink-500 group-hover:text-white">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="text-xs font-black uppercase tracking-tight text-gray-800">
        {label}
      </span>
    </Link>
  )
}
