import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'

// Every figure here is a real product constant, not a marketing estimate:
// account kinds and budget periods come from the schema, the 26 categories
// are the seeded defaults, and the two roles are the shared-account roles.
const facts = [
  { value: 4, label: 'account types', detail: 'Cards, e-wallets, cash and money lent out' },
  { value: 26, label: 'ready-made categories', detail: 'Thirteen for income, thirteen for spending' },
  { value: 3, label: 'budget periods', detail: 'Weekly, monthly or yearly limits' },
  { value: 2, label: 'sharing roles', detail: 'Viewers watch, transactors can log' },
]

export function ProofStrip() {
  return (
    <section aria-label="PennyWings at a glance" className="border-y border-pink-100 bg-white">
      <dl className="mx-auto grid max-w-7xl grid-cols-2 lg:grid-cols-4">
        {facts.map((fact, index) => (
          <div
            key={fact.label}
            className={[
              'flex flex-col gap-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10',
              index % 2 === 1 ? 'border-l border-pink-100' : '',
              index >= 2 ? 'border-t border-pink-100 lg:border-t-0' : '',
              index === 2 ? 'lg:border-l' : '',
            ].join(' ')}
          >
            <dt className="order-2 text-sm font-semibold text-slate-900">{fact.label}</dt>
            <dd className="order-1 font-geist-mono text-4xl font-semibold tabular-nums tracking-tight text-pink-800 lg:text-5xl">
              <CountUp to={fact.value} />
            </dd>
            <dd className="order-3 text-sm leading-relaxed text-slate-600">{fact.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    const node = ref.current
    if (!node || !isInView || prefersReducedMotion) return

    // Writes straight to the text node so the count never re-renders React.
    const controls = animate(0, to, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = String(Math.round(latest))
      },
    })

    return () => controls.stop()
  }, [isInView, prefersReducedMotion, to])

  // Server-rendered and no-JS readers get the final value; the animation
  // only rewinds it once the strip is on screen.
  return <span ref={ref}>{to}</span>
}
