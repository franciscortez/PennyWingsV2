import { Suspense } from 'react'
import { Outlet } from 'react-router'

import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import RouteTransition from '@/components/RouteTransition'

/**
 * The signed-in app chrome, mounted once for every protected route. The guard,
 * theme provider, sidebar, dock and assistant widget persist across navigation;
 * only the routed page inside `Outlet` changes. Suspense sits inside so a page
 * chunk that is still loading never takes the chrome down with it.
 */
export default function AppShell() {
  return (
    <ProtectedRoute>
      <Layout>
        <RouteTransition>
          <Suspense fallback={<div aria-busy="true" className="min-h-[60dvh]" />}>
            <Outlet />
          </Suspense>
        </RouteTransition>
      </Layout>
    </ProtectedRoute>
  )
}
