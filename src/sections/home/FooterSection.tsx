import { Link } from 'react-router'

import { PennyWingsMark } from '@/sections/shared'

export function FooterSection() {
  return (
    <footer className="border-t border-pink-200 bg-gray-50 px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <PennyWingsMark className="h-8 w-8 text-pink-600" />
          <span className="inline-block bg-gradient-to-r from-pink-500 to-pink-700 bg-clip-text text-transparent transition-transform hover:scale-105">
            PennyWings
          </span>
          Budget
        </div>

        <nav
          aria-label="Footer navigation"
          className="flex gap-6 text-sm font-medium text-gray-500"
        >
          <a
            href="#"
            className="transition-colors duration-300 hover:text-pink-600"
          >
            Privacy
          </a>
          <Link
            to="/terms-and-conditions"
            className="transition-colors duration-300 hover:text-pink-600"
          >
            Terms
          </Link>
          <a
            href="#"
            className="transition-colors duration-300 hover:text-pink-600"
          >
            Contact
          </a>
        </nav>

        <div className="text-sm text-gray-400">
          &copy; {new Date().getFullYear()} PennyWings. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
