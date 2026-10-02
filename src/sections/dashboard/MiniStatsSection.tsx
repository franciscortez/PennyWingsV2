import { PiggyBank, ReceiptText, Wallet, type LucideIcon } from 'lucide-react'
import { figure, surface, textMuted } from '@/components/ui/surfaces'

type MiniStatsSectionProps = { accountCount: number; loading: boolean; profileLabel: string; transactionCount: number }
export function MiniStatsSection({ accountCount, loading, profileLabel, transactionCount }: MiniStatsSectionProps) {
  return <section aria-label="Account summary" className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
    <MiniStat icon={Wallet} label="Connected Accounts" value={loading ? '...' : String(accountCount)} numeric />
    <MiniStat icon={PiggyBank} label="Profile" value={profileLabel} />
    <MiniStat icon={ReceiptText} label="Latest Entries" value={loading ? '...' : String(transactionCount)} numeric />
  </section>
}
function MiniStat({ icon: Icon, label, value, numeric = false }: { icon: LucideIcon; label: string; value: string; numeric?: boolean }) {
  return <article className={`${surface} flex min-w-0 items-start gap-3 p-5`}>
    <Icon className="mt-1 h-5 w-5 shrink-0 text-pink-700 dark:text-pink-400" aria-hidden="true" />
    <div className="min-w-0"><h2 className={`text-sm ${textMuted}`}>{label}</h2>
      <p className={`mt-1 break-words text-lg font-semibold text-slate-950 [overflow-wrap:anywhere] dark:text-slate-100 ${numeric ? figure : ''}`}>{value}</p>
    </div>
  </article>
}
