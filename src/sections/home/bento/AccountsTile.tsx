import { Banknote, CreditCard, HandCoins, Smartphone } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { reportCurrency } from '@/lib/currency'
import { BentoCell } from '@/sections/home/bento/BentoCell'
import { mockAccounts } from '@/sections/home/landingMock'
import type { MockAccount } from '@/sections/home/landingMock'

const accountIcons: Record<MockAccount['kind'], LucideIcon> = {
  card: CreditCard,
  'e-wallet': Smartphone,
  cash: Banknote,
  lent: HandCoins,
}

export function AccountsTile({ className }: { className?: string }) {
  return (
    <BentoCell
      tone="tint"
      className={className}
      title="Four kinds of account, one total"
      body="Cards, e-wallets, cash and money you've lent sit side by side, so your total balance means what you think it means."
    >
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {mockAccounts.map((account) => {
          const Icon = accountIcons[account.kind]

          return (
            <li
              key={account.kind}
              className="flex items-center gap-4 rounded-[1.25rem] bg-white p-4 shadow-wing"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-50 text-pink-900">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {account.label}
                </p>
                <p className="truncate text-xs text-slate-600">
                  {account.typeLabel} · {account.detail}
                </p>
              </div>
              <p className="font-geist-mono text-sm font-semibold tabular-nums text-slate-950">
                {reportCurrency.format(account.balance)}
              </p>
            </li>
          )
        })}
      </ul>
    </BentoCell>
  )
}
