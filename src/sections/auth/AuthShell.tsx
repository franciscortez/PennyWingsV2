import { ArrowLeft } from 'lucide-react'
import { MotionConfig, motion } from 'motion/react'
import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router'
import { syncThemeColor } from '@/lib/theme'

import type { AuthPanelContent } from '@/sections/auth/authContent'
import { ImageSlot } from '@/sections/home/ImageSlot'
import { landingImages } from '@/sections/home/landingContent'
import { PennyWingsMark } from '@/sections/shared'

type AuthShellProps = {
  title: string
  subtitle: string
  panel: AuthPanelContent
  backTo?: string
  backLabel?: string
  children: ReactNode
}

// Shared frame for sign in, sign up, forgot and reset password. It speaks the
// landing page's language (Geist, paper background, pink-700 accent, pill
// controls, 32px surfaces) so the handoff from `/` reads as one product.
//
// The form title is the page's only `<h1>` at every breakpoint. The brand
// panel is supplementary, so it uses no headings and hides below `lg`, while
// the header keeps the brand mark visible on every screen size.
export function AuthShell({
  title,
  subtitle,
  panel,
  backTo = '/',
  backLabel = 'Back to home',
  children,
}: AuthShellProps) {
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.style.colorScheme = 'light'
    syncThemeColor('light')
  }, [])

  const PointList = panel.ordered ? 'ol' : 'ul'

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-[100dvh] overflow-x-clip bg-paper font-geist text-slate-950 antialiased">
        <header className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-full text-lg font-semibold tracking-tight text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-800"
          >
            <PennyWingsMark className="h-8 w-11" />
            PennyWings
          </Link>

          <Link
            to={backTo}
            className="group inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-pink-100/70 hover:text-pink-900 focus-visible:outline-2 focus-visible:outline-pink-800"
          >
            <ArrowLeft
              className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            {backLabel}
          </Link>
        </header>

        <main className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-12 lg:items-center lg:gap-10 lg:px-8 lg:pb-8 lg:pt-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="mx-auto w-full max-w-md lg:col-span-5 lg:mx-0"
          >
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tighter text-slate-950 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-slate-600">{subtitle}</p>

            <div className="mt-10">{children}</div>
          </motion.div>

          <motion.aside
            aria-label="About PennyWings"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 70, damping: 18, delay: 0.08 }}
            className="relative isolate hidden overflow-hidden rounded-[2rem] bg-pink-100 p-9 shadow-wing lg:col-span-7 lg:block xl:p-10"
          >
            <div
              aria-hidden="true"
              className="absolute -right-24 -top-24 -z-10 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(closest-side,var(--color-pink-50),transparent)]"
            />

            <ImageSlot
              image={landingImages.hero}
              className="-mr-4 -mt-8 ml-auto w-[14rem] xl:w-[15rem]"
            />

            <p className="-mt-2 max-w-lg text-balance text-3xl font-semibold leading-[1.1] tracking-tighter text-slate-950 xl:text-4xl">
              {panel.headline}
            </p>
            <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed text-slate-600">
              {panel.body}
            </p>

            <PointList className="mt-6 divide-y divide-pink-200/80 border-t border-pink-200/80">
              {panel.points.map((point, index) => (
                <li key={point.title} className="flex gap-4 py-3.5">
                  {panel.ordered ? (
                    <span
                      aria-hidden="true"
                      className="w-4 shrink-0 pt-0.5 font-geist-mono text-sm font-medium tabular-nums text-pink-900">
                      {index + 1}
                    </span>
                  ) : null}
                  <div>
                    <p className="font-semibold tracking-tight text-slate-950">
                      {point.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {point.body}
                    </p>
                  </div>
                </li>
              ))}
            </PointList>
          </motion.aside>
        </main>
      </div>
    </MotionConfig>
  )
}
