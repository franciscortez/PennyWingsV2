import { FormattedFigure } from '@/components/ui/FormattedFigure'
import { surface, surfaceNested, textMuted } from '@/components/ui/surfaces'

type TotalBalanceSectionProps = {
  cardCount: number
  cashCount: number
  lentCount: number
  loading: boolean
  total: number
  walletCount: number
}

const currency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

export function TotalBalanceSection({ cardCount, cashCount, lentCount, loading, total, walletCount }: TotalBalanceSectionProps) {
  const totalAccounts = cardCount + walletCount + cashCount + lentCount

  return (
    <article className={`${surface} min-w-0 p-5 sm:p-6 xl:p-8`}>
      <div className="space-y-6">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white">Total Net Worth</h2>
          <p className="mt-3 text-3xl font-semibold leading-tight tracking-tighter text-pink-700 sm:text-5xl dark:text-pink-400" data-account-total>
            {loading ? 'Loading...' : <FormattedFigure value={currency.format(total)} />}
          </p>
          <p className={`mt-3 text-sm leading-relaxed ${textMuted}`}>
            All active balances combined across your account groups.
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(6rem,1fr))] gap-3">
          <CountPill label="Total" value={loading ? '...' : totalAccounts} />
          <CountPill label="Banks" value={loading ? '...' : cardCount} />
          <CountPill label="E-Wallet" value={loading ? '...' : walletCount} />
          <CountPill label="Cash" value={loading ? '...' : cashCount} />
          <CountPill label="Lent" value={loading ? '...' : lentCount} />
        </div>
      </div>
    </article>
  )
}

function CountPill({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={`${surfaceNested} min-w-0 px-4 py-3`}>
      <p className={`text-sm ${textMuted}`}>{label}</p>
      <p className="mt-1 break-words font-geist-mono text-xl font-semibold tabular-nums text-slate-950 dark:text-white">{value}</p>
    </div>
  )
}
