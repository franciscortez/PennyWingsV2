import { FaPlus, FaUsers } from 'react-icons/fa6'

type TotalBalanceSectionProps = {
  loading: boolean
  onAddClick: () => void
  onJoinClick?: () => void
  total: number
}

const currency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

export function TotalBalanceSection({
  loading,
  onAddClick,
  onJoinClick,
  total,
}: TotalBalanceSectionProps) {
  return (
    <section className="group relative mb-10 overflow-hidden rounded-[3rem] bg-gradient-to-br from-pink-500 to-pink-600 p-8 md:p-12">
      <div className="absolute right-[-20px] top-[-20px] h-64 w-64 rounded-full bg-white/10 blur-[80px] transition-transform duration-1000 group-hover:scale-110" />
      <div className="absolute bottom-[-20px] left-[-20px] h-48 w-48 rounded-full bg-pink-400/20 blur-[60px] transition-transform duration-1000 group-hover:scale-110" />

      <div className="relative z-10 flex flex-col items-center justify-between gap-8 md:flex-row">
        <div className="text-center md:text-left">
          <div className="mb-2 flex items-center justify-center gap-2 md:justify-start">
            <span className="h-2 w-2 animate-pulse rounded-full bg-pink-200 dark:bg-pink-300" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-pink-100">
              Total Net Worth
            </p>
          </div>
          <h2 className="break-words text-4xl font-black tracking-tight text-white md:text-5xl">
            {loading ? 'Loading...' : currency.format(total)}
          </h2>
        </div>

        <div className="flex flex-col gap-3 w-full sm:flex-row sm:w-auto">
          {onJoinClick ? (
            <button
              type="button"
              onClick={onJoinClick}
              className="group/join flex w-full sm:w-auto items-center justify-center gap-3 whitespace-nowrap rounded-[2rem] border-2 border-white/30 bg-white/10 px-6 py-5 text-lg font-black text-white backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-white/50 hover:bg-white/20 active:scale-95"
            >
              <span className="rounded-xl bg-white/20 p-1.5 transition-colors group-hover/join:bg-white/30">
                <FaUsers className="h-5 w-5" aria-hidden="true" />
              </span>
              Join Account
            </button>
          ) : null}

          <button
            type="button"
            onClick={onAddClick}
            className="group/add flex w-full sm:w-auto items-center justify-center gap-3 whitespace-nowrap rounded-[2rem] bg-white px-8 py-5 text-lg font-black text-pink-600 transition-all hover:-translate-y-1 hover:bg-pink-50 active:scale-95 sm:hover:scale-105"
          >
            <span className="rounded-xl bg-pink-100 p-1.5 transition-colors group-hover/add:bg-pink-200">
              <FaPlus className="h-5 w-5" aria-hidden="true" />
            </span>
            Add New Account
          </button>
        </div>
      </div>
    </section>
  )
}

