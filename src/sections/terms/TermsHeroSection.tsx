import { ArrowLeft, LogIn, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'

import { PennyWingsMark } from '@/sections/shared'

export function TermsHeroSection() {
  return (
    <section className="relative px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 rounded-3xl border border-pink-100 bg-white/85 px-4 py-4 shadow-sm shadow-pink-100/70 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3 text-gray-950"
            aria-label="Go to PennyWings home"
          >
            <span className="flex h-11 w-16 shrink-0 items-center justify-center rounded-2xl bg-pink-500 text-white">
              <PennyWingsMark className="h-10 w-15" />
            </span>
            <span className="min-w-0">
              <span className="block bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-xl font-black text-transparent">
                PennyWings
              </span>
              <span className="block text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                Terms
              </span>
            </span>
          </Link>

          <nav
            aria-label="Terms page navigation"
            className="flex flex-col gap-2 text-sm font-bold sm:flex-row"
          >
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-3 text-pink-700 transition hover:border-pink-300 hover:bg-pink-50"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Home
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-pink-700 px-4 py-3 text-white transition hover:from-pink-700 hover:to-pink-800"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Login
            </Link>
          </nav>
        </header>

        <div className="py-14 sm:py-18 lg:py-20">
          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white px-4 py-2 text-sm font-black text-pink-700 shadow-sm shadow-pink-100">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Production-oriented draft
            </div>

            <h1 className="text-4xl font-black tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
              Terms and Conditions
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-8 text-gray-600 sm:text-lg">
              These terms explain how PennyWings should be used, what the app
              provides, and the responsibilities that come with managing
              personal finance records in your account.
            </p>
            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-pink-500">
              Last updated: July 10, 2026
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
