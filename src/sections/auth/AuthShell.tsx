import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { PennyWingsMark } from '@/sections/shared'

type AuthFeature = {
  title: string
  description: string
  icon: 'zap' | 'check' | 'chart' | 'lock' | 'card' | 'shield'
}

type AuthShellProps = {
  title: string
  subtitle: string
  heroTitle: string
  heroDescription: string
  features: AuthFeature[]
  backTo?: string
  backLabel?: string
  children: ReactNode
}

const featureIcons = {
  zap: Zap,
  check: CheckCircle2,
  chart: BarChart3,
  lock: Lock,
  card: CreditCard,
  shield: ShieldCheck,
}

export function AuthShell({
  title,
  subtitle,
  heroTitle,
  heroDescription,
  features,
  backTo = '/',
  backLabel = 'Back to Home',
  children,
}: AuthShellProps) {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-[65%_35%]">
      <section className="relative hidden flex-col overflow-hidden bg-pink-100 p-8 lg:flex lg:p-12">
        <div className="absolute left-20 top-20 h-64 w-64 animate-pulse rounded-full bg-pink-200 opacity-40 blur-3xl mix-blend-multiply" />
        <div className="absolute bottom-20 right-20 h-80 w-80 animate-pulse rounded-full bg-pink-300 opacity-40 blur-3xl mix-blend-multiply [animation-delay:700ms]" />

        <Link
          to={backTo}
          className="group relative z-20 mb-12 flex items-center gap-2 self-start text-pink-700 transition-colors hover:text-pink-800"
        >
          <ArrowLeft
            className="h-5 w-5 transition-transform group-hover:-translate-x-1"
            aria-hidden="true"
          />
          <span className="font-medium">{backLabel}</span>
        </Link>

        <div className="flex flex-1 flex-col justify-center">
          <div className="relative z-10 mx-auto w-full max-w-2xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full bg-pink-600 px-4 py-2 text-sm font-medium text-white">
              <PennyWingsMark className="h-5 w-5 text-white" />
              PennyWings
            </div>

            <h1 className="mb-6 text-5xl font-bold leading-tight text-pink-800 lg:text-6xl">
              {heroTitle}
            </h1>
            <p className="mb-12 text-xl leading-relaxed text-pink-700">
              {heroDescription}
            </p>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {features.map((feature) => {
                const Icon = featureIcons[feature.icon]

                return (
                  <article
                    key={feature.title}
                    className="rounded-2xl border border-pink-200 bg-white/80 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-pink-200">
                      <Icon className="h-6 w-6 text-pink-600" aria-hidden="true" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-pink-800">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-pink-600">
                      {feature.description}
                    </p>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="relative flex flex-col justify-center bg-white p-8 lg:p-12">
        <div className="mx-auto w-full max-w-md">
          <Link
            to={backTo}
            className="group mb-8 flex items-center gap-2 text-pink-700 transition-colors hover:text-pink-800 lg:hidden"
          >
            <ArrowLeft
              className="h-5 w-5 transition-transform group-hover:-translate-x-1"
              aria-hidden="true"
            />
            <span className="font-medium">{backLabel}</span>
          </Link>

          <div className="mb-8">
            <h2 className="mb-3 text-4xl font-bold text-pink-800">{title}</h2>
            <p className="text-lg text-pink-600">{subtitle}</p>
          </div>

          {children}
        </div>
      </section>
    </main>
  )
}
