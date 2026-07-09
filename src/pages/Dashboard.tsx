import Layout from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useErrorAlert } from '@/hooks/useErrorAlert'
import {
  CardsSection,
  DashboardHeader,
  DashboardSkeleton,
  MiniStatsSection,
  ProgressOverviewSection,
  RecentActivitySection,
} from '@/sections/dashboard'

export default function Dashboard() {
  const { profile, user } = useAuth()
  const {
    accounts,
    error,
    loading,
    monthlyStats,
    progress,
    totalBalance,
    transactions,
  } = useDashboardData(user?.id)
  useErrorAlert(error)

  if (loading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    )
  }

  const savingsRate =
    monthlyStats.income > 0
      ? Math.round(
          ((monthlyStats.income - monthlyStats.expenses) /
            monthlyStats.income) *
            100,
        )
      : 0
  const profileLabel = profile?.full_name ?? user?.email ?? 'PennyWings User'

  return (
    <Layout>
      <div className="space-y-10">
        <DashboardHeader />

        <CardsSection
          loading={loading}
          monthlyStats={monthlyStats}
          savingsRate={savingsRate}
          totalBalance={totalBalance}
        />
        <ProgressOverviewSection progress={progress} />
        <RecentActivitySection
          loading={loading}
          transactions={transactions}
        />
        <MiniStatsSection
          accountCount={accounts.length}
          loading={loading}
          profileLabel={profileLabel}
          transactionCount={transactions.length}
        />
      </div>
    </Layout>
  )
}
