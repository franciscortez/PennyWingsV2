import { ArrowLeftRight, ArrowRight } from 'lucide-react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import { useRef } from 'react'
import { Link } from 'react-router'

import { reportCurrency } from '@/lib/currency'
import { ImageSlot } from '@/sections/home/ImageSlot'
import {
  landingImages,
  primaryAction,
  secondaryAction,
} from '@/sections/home/landingContent'
import { mockAccounts, mockTotalBalance } from '@/sections/home/landingMock'

const entrance = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  // Three depths: the scene sinks, the balance card rises, the fee chip rises
  // fastest. Driven by motion values, so scrolling never re-renders React.
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -50])
  const chipY = useTransform(scrollYProgress, [0, 1], [0, -110])
  const parallax = (y: typeof sceneY) =>
    prefersReducedMotion ? undefined : { y }

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute -right-40 -top-32 -z-10 h-[46rem] w-[46rem] rounded-full bg-[radial-gradient(closest-side,var(--color-pink-100),transparent)]"
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 pb-20 pt-12 sm:px-6 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pb-16 lg:pt-10">
        <div className="lg:col-span-6">
          <motion.h1
            id="hero-title"
            {...entrance}
            transition={{ type: 'spring', stiffness: 90, damping: 20 }}
            className="text-5xl font-semibold leading-[1.05] tracking-tighter text-slate-950 sm:text-6xl xl:text-7xl"
          >
            Every peso,
            <br />
            given <em className="font-semibold text-pink-700">wings.</em>
          </motion.h1>

          <motion.p
            {...entrance}
            transition={{ type: 'spring', stiffness: 90, damping: 20, delay: 0.08 }}
            className="mt-6 max-w-[34rem] text-lg leading-relaxed text-slate-600"
          >
            Track cards, e-wallets, cash and money you&apos;ve lent. Budget,
            save and share accounts, all in one calm place.
          </motion.p>

          <motion.div
            {...entrance}
            transition={{ type: 'spring', stiffness: 90, damping: 20, delay: 0.16 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Link to="/signup" className={primaryAction}>
              Start free
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </Link>
            <Link to="/login" className={secondaryAction}>
              Sign in
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 70, damping: 18, delay: 0.1 }}
          className="relative mx-auto w-full max-w-xl lg:col-span-6 lg:max-w-none lg:pl-10"
        >
          <motion.div style={parallax(sceneY)}>
            <ImageSlot image={landingImages.hero} priority />
          </motion.div>

          <motion.div
            style={parallax(cardY)}
            className="absolute -bottom-10 left-3 w-[min(17.5rem,calc(100%-1.5rem))] sm:left-6 lg:-left-6"
          >
            <HeroBalanceCard />
          </motion.div>

          <motion.div
            style={parallax(chipY)}
            className="absolute right-3 top-6 sm:right-6 lg:-right-4"
          >
            <p className="flex items-center gap-2 rounded-full border border-pink-100 bg-white py-2 pl-2 pr-4 text-sm font-medium text-slate-800 shadow-wing">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-100 text-pink-900">
                <ArrowLeftRight className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
              </span>
              Fee kept:
              <span className="font-geist-mono tabular-nums text-pink-900">
                {reportCurrency.format(15)}
              </span>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

function HeroBalanceCard() {
  return (
    <div className="rounded-[1.25rem] border border-pink-100 bg-white p-5 shadow-wing-lg">
      <p className="text-xs font-medium text-slate-600">Total balance</p>
      <p className="mt-1 font-geist-mono text-2xl font-semibold tabular-nums tracking-tight text-slate-950">
        {reportCurrency.format(mockTotalBalance)}
      </p>

      <div
        className="mt-4 flex h-2 gap-0.5 overflow-hidden rounded-full"
        aria-hidden="true"
      >
        {mockAccounts.map((account) => (
          <span
            key={account.kind}
            className={account.tone}
            style={{ width: `${(account.balance / mockTotalBalance) * 100}%` }}
          />
        ))}
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-slate-600">
        {mockAccounts.map((account) => (
          <li key={account.kind} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${account.tone}`} aria-hidden="true" />
            {account.typeLabel}
          </li>
        ))}
      </ul>
    </div>
  )
}
