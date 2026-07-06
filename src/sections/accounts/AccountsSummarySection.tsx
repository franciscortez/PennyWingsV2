import {
  FaBuildingColumns,
  FaMoneyBillWave,
  FaWallet,
} from 'react-icons/fa6'
import type { IconType } from 'react-icons'

type AccountsSummarySectionProps = {
  cardCount: number
  cashCount: number
  loading: boolean
  totalBalance: number
  walletCount: number
}

const currency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

export function AccountsSummarySection({
  cardCount,
  cashCount,
  loading,
  totalBalance,
  walletCount,
}: AccountsSummarySectionProps) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        icon={FaBuildingColumns}
        label="Total Balance"
        value={loading ? 'Loading...' : currency.format(totalBalance)}
      />
      <SummaryCard
        icon={FaBuildingColumns}
        label="Cards"
        value={loading ? '...' : String(cardCount)}
      />
      <SummaryCard
        icon={FaWallet}
        label="E-Wallets"
        value={loading ? '...' : String(walletCount)}
      />
      <SummaryCard
        icon={FaMoneyBillWave}
        label="Cash"
        value={loading ? '...' : String(cashCount)}
      />
    </section>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: IconType
  label: string
  value: string
}) {
  return (
    <article className="flex min-h-28 items-center gap-4 rounded-[2rem] border border-pink-50 bg-white p-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
          {label}
        </p>
        <p className="truncate text-xl font-black text-gray-900">{value}</p>
      </div>
    </article>
  )
}
