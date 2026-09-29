import { Menu, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router'
import { twMerge } from 'tailwind-merge'

import {
  navLinks,
  primaryAction,
} from '@/sections/home/landingContent'
import { PennyWingsMark } from '@/sections/shared'

export function LandingNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuId = useId()

  useEffect(() => {
    if (!isMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMenuOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMenuOpen])

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b border-pink-100/80 bg-paper/85 backdrop-blur-md">
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
      >
        <Link
          to="/"
          className="flex items-center gap-2 rounded-full text-lg font-semibold tracking-tight text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-800"
        >
          <PennyWingsMark className="h-8 w-11" />
          PennyWings
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-pink-100/70 hover:text-pink-900 focus-visible:outline-2 focus-visible:outline-pink-800"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-800 transition-colors hover:text-pink-900 focus-visible:outline-2 focus-visible:outline-pink-800 sm:inline-flex"
          >
            Sign in
          </Link>
          <Link to="/signup" className={twMerge(primaryAction, 'h-10 px-5 text-sm')}>
            Start free
          </Link>
          <button
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls={menuId}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-800 transition-colors hover:bg-pink-100/70 focus-visible:outline-2 focus-visible:outline-pink-800 md:hidden"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      <div
        id={menuId}
        hidden={!isMenuOpen}
        className="border-t border-pink-100 bg-paper px-4 pb-5 pt-2 md:hidden"
      >
        <ul className="divide-y divide-pink-100">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={closeMenu}
                className="flex h-12 items-center text-base font-medium text-slate-800"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <Link
              to="/login"
              onClick={closeMenu}
              className="flex h-12 items-center text-base font-semibold text-pink-900"
            >
              Sign in
            </Link>
          </li>
        </ul>
      </div>
    </header>
  )
}
