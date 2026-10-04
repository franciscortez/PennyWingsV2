import type { ComponentType } from 'react'

type PageModule = { default: ComponentType }

/**
 * One dynamic import per page. `App` builds its `lazy()` routes from this map
 * and the navigation links call `prefetchRoute`, so a hover or focus starts
 * loading the same chunk the click will need. Vite dedupes the import.
 */
export const pageImporters = {
  accounts: () => import('@/pages/Accounts'),
  dashboard: () => import('@/pages/Dashboard'),
  debts: () => import('@/pages/Debts'),
  forgotPassword: () => import('@/pages/auth/ForgotPassword'),
  home: () => import('@/pages/Home'),
  login: () => import('@/pages/auth/Login'),
  monitoring: () => import('@/pages/Monitoring'),
  notFound: () => import('@/pages/NotFound'),
  profile: () => import('@/pages/Profile'),
  register: () => import('@/pages/auth/Register'),
  reports: () => import('@/pages/Reports'),
  resetPassword: () => import('@/pages/auth/ResetPassword'),
  terms: () => import('@/pages/TermsAndConditions'),
  transactions: () => import('@/pages/Transactions'),
} satisfies Record<string, () => Promise<PageModule>>

const routeToPage: Record<string, keyof typeof pageImporters> = {
  '/accounts': 'accounts',
  '/dashboard': 'dashboard',
  '/debts': 'debts',
  '/monitoring': 'monitoring',
  '/profile': 'profile',
  '/reports': 'reports',
  '/transactions': 'transactions',
}

/** Starts loading the page chunk for an app route. Safe to call repeatedly. */
export function prefetchRoute(path: string): void {
  const page = routeToPage[path]

  if (page) {
    void pageImporters[page]()
  }
}
