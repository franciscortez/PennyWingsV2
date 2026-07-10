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

export function TotalBalanceSection({
  cardCount,
  cashCount,
  lentCount,
  loading,
  total,
  walletCount,
}: TotalBalanceSectionProps) {
  const totalAccounts = cardCount + walletCount + cashCount + lentCount

  return (
    <article className="relative min-h-44 overflow-hidden rounded-[2rem] bg-pink-500 p-5 text-white dark:bg-pink-700 sm:p-6 xl:p-8">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.22),transparent_48%),repeating-linear-gradient(90deg,rgba(255,255,255,0.08)_0,rgba(255,255,255,0.08)_1px,transparent_1px,transparent_34px)]" />
      <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div className="min-w-0">
          <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-pink-100">
            Total Net Worth
          </p>
          <h2 className="break-words text-[clamp(2.5rem,7vw,4.5rem)] font-black leading-[0.95] tracking-tight">
            {loading ? 'Loading...' : currency.format(total)}
          </h2>
          <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-pink-50">
            All active balances combined across your account groups.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:w-[34rem]">
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
    <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-3 text-center backdrop-blur-sm">
      <p className="text-[9px] font-black uppercase tracking-widest text-pink-100">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  )
}
