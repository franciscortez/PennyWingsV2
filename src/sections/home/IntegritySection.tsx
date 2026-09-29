import { sectionIds } from '@/sections/home/landingContent'
import { Reveal } from '@/sections/home/Reveal'

// Each claim maps to something the schema actually enforces: the checked
// transaction RPCs, single-statement fee handling, row-level security on the
// public tables, and SHA-256 hashed invite codes with an expiry.
const guarantees = [
  {
    title: 'The database keeps the balances',
    body: 'Your browser never does balance math. Every entry runs through checked database functions that confirm you may use the account and that the funds are there before anything moves.',
  },
  {
    title: 'Transfers land whole, or not at all',
    body: 'The debit, the credit and the fee post together in one operation, so a transfer can never leave money halfway between accounts.',
  },
  {
    title: 'Every row knows its owner',
    body: 'Row-level security decides who can read each record. You see your own accounts and the ones shared with you, and nothing else.',
  },
  {
    title: 'Invite codes are never stored',
    body: 'Only a hash of each WING code is saved. Codes expire after an hour and owners can revoke them before anyone joins.',
  },
]

export function IntegritySection() {
  return (
    <section
      id={sectionIds.security}
      aria-labelledby="security-title"
      className="scroll-mt-20 bg-white px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <Reveal className="max-w-4xl">
          <h2
            id="security-title"
            className="text-4xl font-semibold leading-[1.08] tracking-tighter text-slate-950 md:text-5xl lg:text-6xl"
          >
            Built so the numbers <em className="font-semibold text-pink-700">stay true.</em>
          </h2>
        </Reveal>

        <ol className="mt-16 border-b border-pink-100">
          {guarantees.map((guarantee, index) => (
            <li key={guarantee.title} className="border-t border-pink-100">
              <Reveal
                delay={index * 0.04}
                className="grid grid-cols-1 gap-3 py-8 md:grid-cols-12 md:gap-8 lg:py-10"
              >
                <span
                  className="font-geist-mono text-sm font-medium text-pink-900 md:col-span-1 md:pt-1.5"
                  aria-hidden="true"
                >
                  0{index + 1}
                </span>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-950 md:col-span-5">
                  {guarantee.title}
                </h3>
                <p className="max-w-[60ch] text-[17px] leading-relaxed text-slate-600 md:col-span-6">
                  {guarantee.body}
                </p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
