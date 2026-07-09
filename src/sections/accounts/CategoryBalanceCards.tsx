import { FaBuildingColumns, FaMoneyBillWave, FaWallet } from 'react-icons/fa6'
import type { IconType } from 'react-icons'

import type { AccountKind } from '@/types'

type CategoryBalanceCardsProps = {
  bankBalance: number
  cashBalance: number
  loading: boolean
  walletBalance: number
}

const currency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

const categories: Array<{
  color: string
  gradient: string
  icon: IconType
  id: AccountKind
  label: string
  shadowColor: string
}> = [
  {
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    icon: FaBuildingColumns,
    id: 'card',
    label: 'Banks',
    shadowColor: '#3b82f620',
  },
  {
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    icon: FaWallet,
    id: 'wallet',
    label: 'E-Wallets',
    shadowColor: '#8b5cf620',
  },
  {
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    icon: FaMoneyBillWave,
    id: 'cash',
    label: 'Cash',
    shadowColor: '#10b98120',
  },
]

export function CategoryBalanceCards({
  bankBalance,
  cashBalance,
  loading,
  walletBalance,
}: CategoryBalanceCardsProps) {
  const balanceMap: Record<AccountKind, number> = {
    card: bankBalance,
    cash: cashBalance,
    wallet: walletBalance,
  }

  return (
    <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {categories.map((cat) => {
        const Icon = cat.icon
        const balance = balanceMap[cat.id]

        return (
          <div
            key={cat.id}
            className="group relative overflow-hidden rounded-[2rem] border border-white/60 bg-white p-5 transition-all duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Decorative gradient blur */}
            <div
              className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-2xl transition-transform duration-500 group-hover:scale-150"
              style={{ background: cat.gradient }}
            />

            <div className="relative z-10 flex items-center gap-4">
              {/* Icon */}
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white transition-transform duration-300 group-hover:scale-105"
                style={{ background: cat.gradient }}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>

              {/* Label + Balance */}
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 dark:text-slate-500">
                  {cat.label}
                </p>
                <p className="truncate text-lg font-black tracking-tight text-gray-900 dark:text-slate-100">
                  {loading ? '...' : currency.format(balance)}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}
