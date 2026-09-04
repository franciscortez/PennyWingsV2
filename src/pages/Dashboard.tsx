import Layout from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { useDailySpendingData } from '@/hooks/useDailySpendingData'
import { useDashboardData } from '@/hooks/useDashboardData'
import { useErrorAlert } from '@/hooks/useErrorAlert'
import {
  CardsSection,
  DashboardHeader,
  DashboardSkeleton,
  MiniStatsSection,
  ProgressOverviewSection,
} from '@/sections/dashboard'
import { DailySpendingCalendarSection } from '@/sections/shared'
import { currentMonthInput, toReportMonth } from '@/lib/date'

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
  // The dashboard is a current-month surface and deliberately has no month
  // picker; `/reports` is where other months are browsed.
  const dashboardMonth = currentMonthInput()
  const {
    calendar,
    loading: dailySpendingLoading,
    error: dailySpendingError,
  } = useDailySpendingData(user?.id, toReportMonth(dashboardMonth))
  // `dailySpendingError` is not alerted here. The calendar section owns that
  // query's alert, so repeating it would show the same toast twice.
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
        <DailySpendingCalendarSection
          calendar={calendar}
          error={dailySpendingError}
          loading={dailySpendingLoading}
          month={dashboardMonth}
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
