import { AccountsTile } from '@/sections/home/bento/AccountsTile'
import { BudgetTile } from '@/sections/home/bento/BudgetTile'
import { CalendarTile } from '@/sections/home/bento/CalendarTile'
import { GoalTile } from '@/sections/home/bento/GoalTile'
import { LedgerTile } from '@/sections/home/bento/LedgerTile'
import { ReportTile } from '@/sections/home/bento/ReportTile'
import { sectionIds } from '@/sections/home/landingContent'
import { Reveal } from '@/sections/home/Reveal'

// Six features, six cells. Desktop rows run 4+2, 3+3, 2+4 so no two rows
// share a rhythm; tablet pairs them up; phones stack in reading order.
export function BentoSection() {
  return (
    <section
      id={sectionIds.features}
      aria-labelledby="features-title"
      className="scroll-mt-20 px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-3xl">
          <h2
            id="features-title"
            className="text-4xl font-semibold leading-[1.08] tracking-tighter text-slate-950 md:text-5xl"
          >
            One ledger for every place your money lives.
          </h2>
          <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-slate-600">
            Log it once. PennyWings keeps your balances, budgets, goals and
            monthly reports in step with every entry.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6 lg:gap-5">
          <AccountsTile className="md:col-span-2 lg:col-span-4" />
          <BudgetTile className="lg:col-span-2" delay={0.05} />
          <LedgerTile className="lg:col-span-3" />
          <CalendarTile className="lg:col-span-3" delay={0.05} />
          <GoalTile className="lg:col-span-2" />
          <ReportTile className="md:col-span-2 lg:col-span-4" delay={0.05} />
        </div>
      </div>
    </section>
  )
}
