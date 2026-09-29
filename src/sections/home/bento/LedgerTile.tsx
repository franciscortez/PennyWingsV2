import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { reportCurrency } from '@/lib/currency'
import { BentoCell } from '@/sections/home/bento/BentoCell'
import { mockLedger } from '@/sections/home/landingMock'
import type { MockLedgerRow } from '@/sections/home/landingMock'

const directionIcons: Record<MockLedgerRow['direction'], LucideIcon> = {
  in: ArrowDownLeft,
  out: ArrowUpRight,
  move: ArrowLeftRight,
}

const directionSigns: Record<MockLedgerRow['direction'], string> = {
  in: '+',
  out: '−',
  move: '',
}

export function LedgerTile({ className, delay }: { className?: string; delay?: number }) {
  return (
    <BentoCell
      tone="deep"
      className={className}
      delay={delay}
      title="Fees travel with the transfer"
      body="Transfers and withdrawals keep their fee, so the source account drops by exactly what left it."
    >
      <ul className="divide-y divide-white/10 rounded-[1.25rem] bg-white/5 px-4">
        {mockLedger.map((row) => {
          const Icon = directionIcons[row.direction]

          return (
            <li key={row.label} className="flex items-center gap-3 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-pink-100">
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{row.label}</p>
                <p className="truncate text-xs text-pink-100">{row.meta}</p>
              </div>
              <div className="text-right">
                <p className="font-geist-mono text-sm font-semibold tabular-nums text-white">
                  {directionSigns[row.direction]}
                  {reportCurrency.format(row.amount)}
                </p>
                {row.fee ? (
                  <p className="mt-0.5 font-geist-mono text-[11px] tabular-nums text-pink-200">
                    fee {reportCurrency.format(row.fee)}
                  </p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </BentoCell>
  )
}
