import { PiggyBank, ReceiptText, Wallet, type LucideIcon } from 'lucide-react'

type MiniStatsSectionProps = {
  accountCount: number
  loading: boolean
  profileLabel: string
  transactionCount: number
}

export function MiniStatsSection({
  accountCount,
  loading,
  profileLabel,
  transactionCount,
}: MiniStatsSectionProps) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <MiniStat
        icon={Wallet}
        label="Connected Accounts"
        value={loading ? '...' : String(accountCount)}
      />
      <MiniStat icon={PiggyBank} label="Profile" value={profileLabel} />
      <MiniStat
        icon={ReceiptText}
        label="Latest Entries"
        value={loading ? '...' : String(transactionCount)}
      />
    </section>
  )
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <article className="flex items-center gap-4 rounded-[2rem] border border-pink-50 bg-white p-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
          {label}
        </p>
        <p className="truncate text-lg font-black text-gray-900">{value}</p>
      </div>
    </article>
  )
}
