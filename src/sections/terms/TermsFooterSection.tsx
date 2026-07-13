import { ArrowLeft, UserPlus } from 'lucide-react'
import { Link } from 'react-router'

import { PennyWingsMark } from '@/sections/shared'

export function TermsFooterSection() {
  return (
    <footer className="border-t border-pink-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="rounded-3xl bg-gradient-to-r from-pink-600 to-pink-700 p-6 text-white shadow-xl shadow-pink-200 sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-pink-100">
                Back to PennyWings
              </p>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                Keep tracking with clarity.
              </h2>
              <p className="mt-3 text-sm font-medium leading-7 text-pink-50 sm:text-base">
                Return to the public site or sign in to continue managing your
                accounts, budgets, goals, and reports.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row md:shrink-0">
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-pink-700 transition hover:bg-pink-50"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Home
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                Create Account
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-black text-gray-950"
          >
            <PennyWingsMark className="h-8 w-8 text-pink-600" />
            <span>
              <span className="bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent">
                PennyWings
              </span>{' '}
              Budget
            </span>
          </Link>
          <p className="text-sm font-medium text-gray-400">
            &copy; {new Date().getFullYear()} PennyWings. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
