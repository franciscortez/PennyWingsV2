import { Building2, HandCoins, Banknote, Wallet } from 'lucide-react'
import { FormattedFigure } from '@/components/ui/FormattedFigure'
import { surface, textMuted } from '@/components/ui/surfaces'
import type { AccountKind } from '@/types'

type CategoryBalanceCardsProps = {
  bankBalance: number
  cashBalance: number
  lentBalance: number
  loading: boolean
  walletBalance: number
}

const currency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

const categories = [
  { icon: Building2, id: 'card', label: 'Banks' },
  { icon: Wallet, id: 'wallet', label: 'E-Wallets' },
  { icon: Banknote, id: 'cash', label: 'Cash' },
  { icon: HandCoins, id: 'lent', label: 'Lent' },
] as const

export function CategoryBalanceCards({ bankBalance, cashBalance, lentBalance, loading, walletBalance }: CategoryBalanceCardsProps) {
  const balanceMap: Record<AccountKind, number> = {
    card: bankBalance,
    cash: cashBalance,
    lent: lentBalance,
    wallet: walletBalance,
  }

  return (
    <section aria-label="Balances by account category" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {categories.map(({ icon: Icon, id, label }) => (
        <article key={id} className={`${surface} min-w-0 p-5`}>
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 shrink-0 text-pink-700 dark:text-pink-400" aria-hidden="true" />
            <h3 className={`min-w-0 break-words text-sm font-medium ${textMuted}`}>{label}</h3>
          </div>
          <p className="mt-3 text-xl font-semibold leading-snug text-slate-950 dark:text-white" data-account-category={id}>
            {loading ? '...' : <FormattedFigure value={currency.format(balanceMap[id])} />}
          </p>
        </article>
      ))}
    </section>
  )
}
