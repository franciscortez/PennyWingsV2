import { ArrowLeft, Compass, LayoutDashboard, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'

import Layout from '@/components/Layout'
import { AppButton, PageLoader } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { PennyWingsMark } from '@/sections/shared'

export default function NotFound() {
  const { loading, user } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return <PageLoader />
  }

  if (user) {
    return (
      <Layout>
        <NotFoundPanel
          homeTo="/dashboard"
          homeLabel="Back to Dashboard"
          onBack={() => navigate(-1)}
        />
      </Layout>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-pink-50 px-4 py-6 text-gray-900 md:px-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <AppButton to="/" variant="ghost" className="rounded-xl px-2 text-gray-700">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500 text-white">
            <PennyWingsMark className="h-7 w-7" />
          </span>
          <span className="bg-linear-to-r from-pink-600 to-pink-500 bg-clip-text text-lg font-black text-transparent">
            PennyWings
          </span>
        </AppButton>
        <AppButton to="/login" variant="secondary" size="sm">
          Sign In
        </AppButton>
      </header>

      <section className="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-6xl items-center justify-center py-14">
        <div className="absolute left-4 top-16 h-64 w-64 rounded-full bg-pink-200 opacity-30 blur-3xl" />
        <div className="absolute bottom-16 right-4 h-72 w-72 rounded-full bg-pink-300 opacity-30 blur-3xl" />
        <NotFoundPanel
          homeTo="/"
          homeLabel="Back to Home"
          onBack={() => navigate(-1)}
        />
      </section>
    </main>
  )
}

function NotFoundPanel({
  homeLabel,
  homeTo,
  onBack,
}: {
  homeLabel: string
  homeTo: string
  onBack: () => void
}) {
  return (
    <section className="animate-fade-in relative z-10 w-full max-w-3xl rounded-4xl border border-pink-100 bg-white p-6 text-center shadow-2xl shadow-pink-100/70 md:p-10">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-pink-50 text-pink-600">
        <Compass className="h-10 w-10" aria-hidden="true" />
      </div>

      <p className="mb-3 text-xs font-black uppercase tracking-[0.24em] text-pink-500">
        Page Not Found
      </p>
      <h1 className="mx-auto max-w-2xl text-4xl font-black tracking-tight text-gray-950 md:text-6xl">
        This page flew off course.
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-relaxed text-gray-500 md:text-lg">
        The link may be old, moved, or typed incorrectly. Return to a known
        page and keep your budget tracking on course.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <AppButton to={homeTo} className="w-full sm:w-auto">
          <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
          {homeLabel}
        </AppButton>
        <AppButton
          type="button"
          variant="secondary"
          onClick={onBack}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          Go Back
        </AppButton>
      </div>

      <div className="mt-8 grid gap-3 border-t border-pink-50 pt-6 text-left sm:grid-cols-2">
        <QuickLink
          icon={<Search className="h-5 w-5" aria-hidden="true" />}
          label="Find your dashboard"
          text="Review balances, cards, and recent activity."
          to="/dashboard"
        />
        <QuickLink
          icon={<PennyWingsMark className="h-5 w-5" />}
          label="Visit PennyWings"
          text="Return to the public home page."
          to="/"
        />
      </div>
    </section>
  )
}

function QuickLink({
  icon,
  label,
  text,
  to,
}: {
  icon: ReactNode
  label: string
  text: string
  to: string
}) {
  return (
    <AppButton
      to={to}
      variant="ghost"
      className="h-full justify-start rounded-2xl border border-pink-50 bg-pink-50/50 p-4 text-left hover:border-pink-100"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-pink-600">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black text-gray-800">{label}</span>
        <span className="mt-1 block text-xs font-bold leading-relaxed text-gray-400">
          {text}
        </span>
      </span>
    </AppButton>
  )
}
