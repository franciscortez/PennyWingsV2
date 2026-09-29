import { Link2 } from 'lucide-react'
import { motion } from 'motion/react'

import { reportCurrency } from '@/lib/currency'
import { BentoCell } from '@/sections/home/bento/BentoCell'
import { mockGoal } from '@/sections/home/landingMock'

export function GoalTile({ className, delay }: { className?: string; delay?: number }) {
  const progress = mockGoal.current / mockGoal.target

  return (
    <BentoCell
      tone="dots"
      className={className}
      delay={delay}
      title="Goals that follow a balance"
      body="Link a savings goal to a card or e-wallet and its progress moves when the balance does."
    >
      <div className="rounded-[1.25rem] border border-pink-100 bg-white p-5 shadow-wing">
        <div className="flex items-start justify-between gap-3">
          <p className="font-semibold text-slate-950">{mockGoal.name}</p>
          <p className="font-geist-mono text-xs font-medium tabular-nums text-slate-600">
            {mockGoal.daysLeft} days left
          </p>
        </div>

        <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-2.5 py-1 text-xs font-medium text-pink-900">
          <Link2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          Linked to {mockGoal.linkedAccount}
        </p>

        <div
          className="mt-5 h-2.5 overflow-hidden rounded-full bg-pink-100"
          role="progressbar"
          aria-label={`${mockGoal.name} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <motion.div
            className="h-full origin-left rounded-full bg-pink-700"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: progress }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 50, damping: 16 }}
          />
        </div>

        <p className="mt-3 font-geist-mono text-sm tabular-nums text-slate-600">
          <span className="font-semibold text-slate-950">
            {reportCurrency.format(mockGoal.current)}
          </span>{' '}
          of {reportCurrency.format(mockGoal.target)}
        </p>
      </div>
    </BentoCell>
  )
}
