import { ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'

import { PennyWingsMark } from '@/sections/shared'
import { Reveal } from '@/sections/home/Reveal'

export function CtaSection() {
  return (
    <section aria-labelledby="cta-title" className="px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <Reveal className="mx-auto max-w-7xl">
        <div className="relative isolate overflow-hidden rounded-[2rem] bg-pink-900 px-6 py-16 sm:px-12 lg:grid lg:grid-cols-12 lg:items-center lg:gap-8 lg:px-16 lg:py-20">
          <div
            aria-hidden="true"
            className="absolute -right-24 -top-24 -z-10 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(closest-side,var(--color-pink-700),transparent)] opacity-70"
          />

          <div className="lg:col-span-7">
            <h2
              id="cta-title"
              className="text-4xl font-semibold leading-[1.08] tracking-tighter text-white md:text-5xl lg:text-6xl"
            >
              Give your pesos somewhere to land.
            </h2>
            <p className="mt-5 max-w-[46ch] text-lg leading-relaxed text-pink-100">
              Add your accounts, log what moves, and watch the whole picture
              come together.
            </p>
            <Link
              to="/signup"
              className="mt-9 inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 font-semibold text-pink-900 transition-[background-color,transform] duration-200 hover:bg-pink-50 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Start free
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-12 flex justify-center lg:col-span-5 lg:mt-0">
            <motion.div
              animate={{ y: [0, -14, 0], rotate: [0, -2, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <PennyWingsMark className="h-48 w-48 drop-shadow-[0_30px_40px_rgb(40_6_20/0.45)] sm:h-64 sm:w-64" />
            </motion.div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
