import type { ReactNode } from 'react'

import Layout from '@/components/Layout'

type DashboardShellProps = {
  children: ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  return <Layout>{children}</Layout>
}
