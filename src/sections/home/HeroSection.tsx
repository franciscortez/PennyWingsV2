import { ArrowRight } from 'lucide-react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import { useRef } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { twMerge } from 'tailwind-merge'

import { compactReportCurrency } from '@/lib/currency'
import { ImageSlot } from '@/sections/home/ImageSlot'
import {
  landingImages,
  primaryAction,
  secondaryAction,
} from '@/sections/home/landingContent'
import { mockReport } from '@/sections/home/landingMock'

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

  // Two depths: the app window barely moves, and the scene sinks a little
  // into it. Driven by motion values, so scrolling never re-renders React.
  const windowY = useTransform(scrollYProgress, [0, 1], [0, 20])
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 45])
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
      <HeroRibbons />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-4 pb-20 pt-12 sm:px-6 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-12 lg:gap-8 lg:px-8 lg:pb-16 lg:pt-10">
        <div className="lg:col-span-6">
          <motion.h1
            id="hero-title"
            initial="hidden"
            animate="shown"
            variants={{
              hidden: {},
              shown: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
            }}
            className="text-5xl font-semibold leading-[1.05] tracking-tighter text-slate-950 sm:text-6xl xl:text-7xl"
          >
            <HeadlineWord>Every</HeadlineWord> <HeadlineWord>peso,</HeadlineWord>
            <br />
            <HeadlineWord>given</HeadlineWord>{' '}
            <HeadlineWord className="relative isolate">
              <em className="font-semibold text-pink-700">wings.</em>
              <svg
                className="absolute -bottom-[0.16em] left-[1%] -z-10 h-[0.32em] w-[92%] overflow-visible"
                viewBox="0 0 200 20"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.path
                  d="M3 15 C 50 5, 130 2, 197 10"
                  fill="none"
                  className="stroke-pink-300"
                  strokeWidth="6"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  initial={prefersReducedMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.55, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>
            </HeadlineWord>
          </motion.h1>

          <motion.p
            {...entrance}
            transition={{ type: 'spring', stiffness: 90, damping: 20, delay: 0.3 }}
            className="mt-7 max-w-[34rem] text-lg leading-relaxed text-slate-600"
          >
            Track cards, e-wallets, cash and money you&apos;ve lent. Budget,
            save and share accounts, all in one calm place.
          </motion.p>

          <motion.div
            {...entrance}
            transition={{ type: 'spring', stiffness: 90, damping: 20, delay: 0.38 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Link to="/signup" className={twMerge(primaryAction, 'group')}>
              Start free
              <ArrowRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                strokeWidth={1.75}
                aria-hidden="true"
              />
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
          className="relative mx-auto mb-16 w-full max-w-xl lg:col-span-6 lg:max-w-none lg:pl-10"
        >
          <motion.div
            style={parallax(windowY)}
            className="absolute -bottom-16 left-[4%] right-[4%] top-[26%] lg:left-[calc(2.5rem+4%)]"
          >
            <HeroAppWindow />
          </motion.div>

          <motion.div style={parallax(sceneY)} className="relative">
            <ImageSlot image={landingImages.hero} priority />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// One word of the hero headline. The parent `h1` staggers these in, so the
// headline rises word by word while still reading as a single heading.
function HeadlineWord({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.span
      className={twMerge('inline-block', className)}
      variants={{
        hidden: { opacity: 0, y: '0.45em' },
        shown: { opacity: 1, y: 0 },
      }}
      transition={{ type: 'spring', stiffness: 110, damping: 20 }}
    >
      {children}
    </motion.span>
  )
}

// A deep pink app window behind the transparent hero scene. Its top edge
// crosses the wings, so the butterfly flies up out of it while the coins,
// card and phone rest inside. The footer shows the same monthly figures as
// the report tile further down the page.
function HeroAppWindow() {
  const net = mockReport.income - mockReport.expenses
  const stats = [
    { label: 'Income', value: compactReportCurrency.format(mockReport.income) },
    { label: 'Spent', value: compactReportCurrency.format(mockReport.expenses) },
    { label: 'Saved', value: `${Math.round((net / mockReport.income) * 100)}%` },
  ]

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-[linear-gradient(160deg,var(--color-pink-700),var(--color-pink-900))] shadow-wing-lg">
      <div className="absolute left-5 top-4 flex gap-1.5" aria-hidden="true">
        <span className="h-2 w-2 rounded-full bg-pink-200/70" />
        <span className="h-2 w-2 rounded-full bg-pink-200/50" />
        <span className="h-2 w-2 rounded-full bg-pink-200/30" />
      </div>

      <svg
        className="absolute inset-x-6 bottom-20 h-1/3 w-[calc(100%-3rem)] opacity-40"
        viewBox="0 0 300 60"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 50 C 40 44, 60 20, 100 28 S 170 50, 210 22 S 270 8, 300 12"
          fill="none"
          className="stroke-pink-300"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <dl
        aria-label={`${mockReport.month} at a glance`}
        className="absolute inset-x-0 bottom-0 grid h-16 grid-cols-3 items-center border-t border-white/10 text-center"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col">
            <dt className="text-xs text-pink-100">{stat.label}</dt>
            <dd className="font-geist-mono text-sm font-semibold tabular-nums text-white">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// Brand ribbons sweeping in from the lower corners, echoing the wings.
function HeroRibbons() {
  return (
    <svg
      className="absolute inset-x-0 bottom-0 -z-10 h-28 w-full sm:h-36"
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d="M0 160 V96 C 260 30 520 150 820 118 C 1060 92 1260 40 1440 70 V160 Z" className="fill-pink-100" />
      <path d="M0 118 C 300 58 560 168 860 132 C 1100 104 1280 66 1440 92" fill="none" className="stroke-pink-500" strokeWidth="6" />
      <path d="M0 140 C 320 86 600 176 900 148 C 1130 126 1300 96 1440 112" fill="none" className="stroke-pink-200" strokeWidth="10" />
    </svg>
  )
}
