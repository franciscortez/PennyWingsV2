import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import Layout from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { useMonitoringData } from '@/hooks/useMonitoringData'
import { alerts } from '@/lib/alert'
import {
  BudgetModal,
  BudgetsPanel,
  GoalModal,
  GoalsPanel,
  MonitoringHeader,
  MonitoringSummarySection,
  MonitoringTabs,
  type ModalMode,
} from '@/sections/monitoring'
import type {
  Budget,
  BudgetFormValues,
  Goal,
  GoalFormValues,
  MonitoringTab,
} from '@/types'

const getTabFromUrl = (value: string | null): MonitoringTab =>
  value === 'goals' ? 'goals' : 'budgets'

export default function Monitoring() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = getTabFromUrl(searchParams.get('tab'))
  const [budgetModal, setBudgetModal] = useState<{
    budget: Budget | null
    mode: ModalMode
  } | null>(null)
  const [goalModal, setGoalModal] = useState<{
    goal: Goal | null
    mode: ModalMode
  } | null>(null)
  const {
    accounts,
    addBudget,
    addGoal,
    budgets,
    deletingId,
    editBudget,
    editGoal,
    error,
    expenseCategories,
    goals,
    loading,
    optionsLoading,
    removeBudget,
    removeGoal,
    saving,
    summary,
  } = useMonitoringData(user?.id, activeTab)

  const linkedGoalCount = useMemo(
    () => goals.filter((goal) => goal.linkedAccount).length,
    [goals],
  )

  const openCreateBudgetModal = () => {
    setBudgetModal({ mode: 'create', budget: null })
  }

  const openCreateGoalModal = () => {
    setGoalModal({ mode: 'create', goal: null })
  }

  const closeBudgetModal = () => {
    if (!saving) {
      setBudgetModal(null)
    }
  }

  const closeGoalModal = () => {
    if (!saving) {
      setGoalModal(null)
    }
  }

  const handleTabChange = (tab: MonitoringTab) => {
    setSearchParams({ tab })
  }

  const handleSaveBudget = async (values: BudgetFormValues) => {
    if (!budgetModal) {
      return false
    }

    const { error: saveError } =
      budgetModal.mode === 'edit' && budgetModal.budget
        ? await editBudget(budgetModal.budget.id, values)
        : await addBudget(values)

    if (saveError) {
      alerts.error(saveError.message)
      return false
    }

    alerts.success(
      budgetModal.mode === 'edit' ? 'Budget updated.' : 'Budget created.',
    )
    setBudgetModal(null)
    return true
  }

  const handleSaveGoal = async (values: GoalFormValues) => {
    if (!goalModal) {
      return false
    }

    const { error: saveError } =
      goalModal.mode === 'edit' && goalModal.goal
        ? await editGoal(goalModal.goal.id, values)
        : await addGoal(values)

    if (saveError) {
      alerts.error(saveError.message)
      return false
    }

    alerts.success(goalModal.mode === 'edit' ? 'Goal updated.' : 'Goal created.')
    setGoalModal(null)
    return true
  }

  const handleDeleteBudget = async (budget: Budget) => {
    const confirmed = await alerts.confirmDelete(
      'Budget',
      `Delete the ${budget.category?.name ?? 'selected'} budget?`,
    )

    if (!confirmed) {
      return
    }

    const { error: deleteError } = await removeBudget(budget.id)

    if (deleteError) {
      alerts.error(deleteError.message)
    } else {
      alerts.success('Budget deleted.')
    }
  }

  const handleDeleteGoal = async (goal: Goal) => {
    const confirmed = await alerts.confirmDelete(
      'Goal',
      `Delete "${goal.name}"?`,
    )

    if (!confirmed) {
      return
    }

    const { error: deleteError } = await removeGoal(goal.id)

    if (deleteError) {
      alerts.error(deleteError.message)
    } else {
      alerts.success('Goal deleted.')
    }
  }

  return (
    <Layout>
      <div className="space-y-8 pb-20">
        <MonitoringHeader
          activeTab={activeTab}
          onCreateBudget={openCreateBudgetModal}
          onCreateGoal={openCreateGoalModal}
        />

        {error ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
            {error}
          </div>
        ) : null}

        <MonitoringSummarySection
          budgetCount={budgets.length}
          goalCount={goals.length}
          linkedGoalCount={linkedGoalCount}
          loading={loading}
          summary={summary}
        />

        <MonitoringTabs
          activeTab={activeTab}
          budgetCount={budgets.length}
          goalCount={goals.length}
          onChange={handleTabChange}
        />

        {activeTab === 'budgets' ? (
          <BudgetsPanel
            budgets={budgets}
            deletingId={deletingId}
            loading={loading}
            onCreate={openCreateBudgetModal}
            onDelete={handleDeleteBudget}
            onEdit={(budget) => setBudgetModal({ mode: 'edit', budget })}
          />
        ) : (
          <GoalsPanel
            deletingId={deletingId}
            goals={goals}
            loading={loading}
            onCreate={openCreateGoalModal}
            onDelete={handleDeleteGoal}
            onEdit={(goal) => setGoalModal({ mode: 'edit', goal })}
          />
        )}
      </div>

      {budgetModal ? (
        <BudgetModal
          budget={budgetModal.budget}
          categories={expenseCategories}
          mode={budgetModal.mode}
          saving={saving || optionsLoading}
          onClose={closeBudgetModal}
          onSubmit={handleSaveBudget}
        />
      ) : null}

      {goalModal ? (
        <GoalModal
          accounts={accounts}
          goal={goalModal.goal}
          mode={goalModal.mode}
          saving={saving || optionsLoading}
          onClose={closeGoalModal}
          onSubmit={handleSaveGoal}
        />
      ) : null}
    </Layout>
  )
}
