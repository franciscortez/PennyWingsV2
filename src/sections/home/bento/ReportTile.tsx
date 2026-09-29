import { motion } from 'motion/react'

import { reportCurrency } from '@/lib/currency'
import { BentoCell } from '@/sections/home/bento/BentoCell'
import { mockReport } from '@/sections/home/landingMock'

export function ReportTile({ className, delay }: { className?: string; delay?: number }) {
  const net = mockReport.income - mockReport.expenses
  const savingsRate = Math.round((net / mockReport.income) * 100)
  const largestCategory = Math.max(...mockReport.categories.map((category) => category.amount))

  const figures = [
    { label: 'Income', value: reportCurrency.format(mockReport.income) },
    { label: 'Spent', value: reportCurrency.format(mockReport.expenses) },
    { label: 'Net', value: `+${reportCurrency.format(net)}` },
  ]

  return (
    <BentoCell
      className={className}
      delay={delay}
      title="A report for every month"
      body="Income, spending, net cash flow, your top categories and a snapshot of every account, saved month by month."
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-5">
        <div className="md:col-span-2">
          <p className="text-sm font-semibold text-slate-900">{mockReport.month}</p>
          <dl className="mt-3 divide-y divide-pink-100 border-y border-pink-100">
            {figures.map((figure) => (
              <div key={figure.label} className="flex items-baseline justify-between gap-3 py-2.5">
                <dt className="text-sm text-slate-600">{figure.label}</dt>
                <dd className="font-geist-mono text-sm font-semibold tabular-nums text-slate-950">
                  {figure.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-sm text-slate-600">
            <span className="font-geist-mono font-semibold tabular-nums text-pink-900">
              {savingsRate}%
            </span>{' '}
            of income saved
          </p>
        </div>

        <ul className="space-y-3 md:col-span-3" aria-label={`Top spending categories in ${mockReport.month}`}>
          {mockReport.categories.map((category, index) => (
            <li key={category.name}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-slate-800">{category.name}</span>
                <span className="font-geist-mono tabular-nums text-slate-600">
                  {reportCurrency.format(category.amount)}
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-pink-50">
                <motion.div
                  className={`h-full origin-left rounded-full ${category.tone}`}
                  style={{ width: `${(category.amount / largestCategory) * 100}%` }}
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 70, damping: 18, delay: index * 0.06 }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </BentoCell>
  )
}
