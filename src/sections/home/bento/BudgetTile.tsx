import { motion, useInView } from 'motion/react'
import { useRef, useState } from 'react'

import { reportCurrency } from '@/lib/currency'
import { BentoCell } from '@/sections/home/bento/BentoCell'
import { mockBudgets } from '@/sections/home/landingMock'
import type { BudgetPeriod } from '@/sections/home/landingMock'

const periods: { value: BudgetPeriod; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

export function BudgetTile({ className, delay }: { className?: string; delay?: number }) {
  const [period, setPeriod] = useState<BudgetPeriod>('monthly')
  const ringRef = useRef<SVGSVGElement>(null)
  const hasBeenSeen = useInView(ringRef, { once: true })
  const budget = mockBudgets[period]
  const progress = Math.min(budget.spent / budget.limit, 1)
  const percent = Math.round(progress * 100)

  return (
    <BentoCell
      className={className}
      delay={delay}
      title="Budgets on your rhythm"
      body="Set a limit per category for the week, month or year, then watch what's left."
    >
      <div
        role="group"
        aria-label="Budget period"
        className="flex rounded-full bg-pink-50 p-1"
      >
        {periods.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={period === option.value}
            onClick={() => setPeriod(option.value)}
            className={[
              'h-9 flex-1 rounded-full text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-pink-800',
              period === option.value
                ? 'bg-white text-pink-900 shadow-wing'
                : 'text-slate-600 hover:text-pink-900',
            ].join(' ')}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-5">
        <svg ref={ringRef} viewBox="0 0 100 100" className="h-28 w-28 shrink-0 -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" className="stroke-pink-100" />
          <motion.circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            className="stroke-pink-700"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: hasBeenSeen ? progress : 0 }}
            transition={{ type: 'spring', stiffness: 60, damping: 18 }}
          />
        </svg>

        <div aria-live="polite">
          <p className="font-geist-mono text-3xl font-semibold tabular-nums tracking-tight text-slate-950">
            {percent}%
          </p>
          <p className="text-sm text-slate-600">of Food &amp; dining used</p>
          <p className="mt-2 font-geist-mono text-sm font-medium tabular-nums text-pink-900">
            {reportCurrency.format(budget.limit - budget.spent)} left
          </p>
        </div>
      </div>
    </BentoCell>
  )
}
