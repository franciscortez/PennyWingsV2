import { Link } from 'react-router'

import { navLinks } from '@/sections/home/landingContent'
import { PennyWingsMark } from '@/sections/shared'

const linkClassName =
  'rounded-full text-sm text-slate-600 transition-colors hover:text-pink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-800'

export function FooterSection() {
  return (
    <footer className="border-t border-pink-100 bg-white px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full text-lg font-semibold tracking-tight text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-800"
          >
            <PennyWingsMark className="h-8 w-11" />
            PennyWings
          </Link>
          <p className="mt-4 max-w-[36ch] text-sm leading-relaxed text-slate-600">
            A calm place for every peso: cards, e-wallets, cash and money
            you&apos;ve lent.
          </p>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8 md:col-span-7 md:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">Product</p>
            <ul className="mt-4 space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className={linkClassName}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">Account</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/signup" className={linkClassName}>
                  Start free
                </Link>
              </li>
              <li>
                <Link to="/login" className={linkClassName}>
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-950">Legal</p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/terms-and-conditions" className={linkClassName}>
                  Terms and conditions
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div className="mx-auto mt-12 max-w-7xl border-t border-pink-100 pt-6 text-sm text-slate-600">
        &copy; {new Date().getFullYear()} PennyWings. All rights reserved.
      </div>
    </footer>
  )
}
