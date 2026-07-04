import { CircleDollarSign, ShoppingBag, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router'

import { PennyWingsMark } from '@/sections/shared'

const transactions = [
  {
    name: 'Coffee Shop',
    amount: '-PHP 250.00',
    icon: <ShoppingBag className="h-5 w-5 text-gray-400" aria-hidden="true" />,
    positive: false,
  },
  {
    name: 'Monthly Salary',
    amount: '+PHP 45,000.00',
    icon: (
      <CircleDollarSign
        className="h-5 w-5 text-emerald-500"
        aria-hidden="true"
      />
    ),
    positive: true,
  },
  {
    name: 'Grocery Store',
    amount: '-PHP 2,450.20',
    icon: (
      <ShoppingCart className="h-5 w-5 text-orange-400" aria-hidden="true" />
    ),
    positive: false,
  },
]

export function HeroSection() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-4 py-20 md:py-32">
      <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-pink-200 opacity-20 mix-blend-multiply" />
      <div className="absolute right-10 top-40 h-80 w-80 rounded-full bg-pink-300 opacity-20 mix-blend-multiply" />

      <div className="animate-fade-in relative z-10 flex w-full max-w-6xl flex-col items-center justify-between gap-12 md:flex-row">
        <div className="flex-1 space-y-6 text-center md:text-left">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white px-4 py-2 text-sm font-medium text-pink-600">
            <PennyWingsMark className="h-5 w-5 text-pink-500" />
            PennyWings Tracker
          </div>

          <h1 className="text-4xl font-bold leading-tight text-gray-900 md:text-5xl lg:text-6xl">
            Watch your savings{' '}
            <span className="bg-gradient-to-r from-pink-500 to-pink-700 bg-clip-text text-transparent">
              flutter
            </span>{' '}
            to new heights.
          </h1>

          <p className="mx-auto max-w-lg text-lg text-gray-600 md:mx-0">
            Take flight with your finances. Transform complex tracking into a
            beautiful, guided journey. Manage cards, e-wallets, and goals with
            ease.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row md:justify-start">
            <Link
              to="/signup"
              className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-pink-700 px-8 py-3.5 text-center font-medium text-white transition-all duration-300 hover:-translate-y-1 hover:from-pink-600 hover:to-pink-800 sm:w-auto"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="w-full rounded-xl border-2 border-pink-300 bg-white px-8 py-3.5 text-center font-medium text-pink-700 transition-all duration-300 hover:border-pink-400 hover:bg-pink-50 sm:w-auto"
            >
              Sign In
            </Link>
          </div>
        </div>

        <div className="animate-fade-in-delay group relative mx-auto w-full max-w-md flex-1 md:max-w-none">
          <div className="absolute inset-0 rotate-3 rounded-[2.5rem] bg-gradient-to-tr from-pink-300 to-pink-200 opacity-30 scale-105" />
          <div className="relative rounded-[2.5rem] border border-pink-200 bg-white p-8 transition-transform duration-300 group-hover:-translate-y-2">
            <div className="space-y-6">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <div className="mb-1 text-sm font-medium text-gray-400">
                    Total Balance
                  </div>
                  <div className="text-3xl font-bold text-gray-800">
                    PHP 12,450.00
                  </div>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white bg-gradient-to-br from-pink-100 to-pink-200">
                  <PennyWingsMark className="h-10 w-10 text-pink-600" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-gray-800">
                  Recent Transactions
                </div>
                {transactions.map((transaction) => {
                  const amountClassName = transaction.positive
                    ? 'text-emerald-500'
                    : 'text-red-500'

                  return (
                    <div
                      key={transaction.name}
                      className="flex items-center justify-between rounded-xl border border-transparent bg-gray-50/80 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-pink-200 hover:bg-pink-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-white p-2">
                          {transaction.icon}
                        </div>
                        <span className="font-medium text-gray-700">
                          {transaction.name}
                        </span>
                      </div>
                      <span className={`font-semibold ${amountClassName}`}>
                        {transaction.amount}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
