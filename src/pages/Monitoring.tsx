import {
  CalendarDays,
  Flag,
  Gauge,
  Pencil,
  Plus,
  ReceiptText,
  Target,
  Trash2,
  WalletCards,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'

import Layout from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { useMonitoringData } from '@/hooks/useMonitoringData'
import { alerts } from '@/lib/alert'
import { budgetSchema, goalSchema } from '@/validation/monitoringSchemas'
import { getZodErrorMessage } from '@/validation/zodError'
import type {
  Account,
  Budget,
  BudgetFormValues,
  BudgetPeriod,
  Goal,
  GoalFormValues,
  MonitoringCategory,
  MonitoringTab,
} from '@/types'

type ModalMode = 'create' | 'edit'

const currency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  minimumFractionDigits: 2,
  style: 'currency',
})

const compactCurrency = new Intl.NumberFormat('en-PH', {
  currency: 'PHP',
  maximumFractionDigits: 0,
  style: 'currency',
})

const tabs: Array<{
  icon: LucideIcon
  id: MonitoringTab
  label: string
}> = [
  { id: 'budgets', label: 'Budgets', icon: ReceiptText },
  { id: 'goals', label: 'Goals', icon: Target },
]

const periodOptions: Array<{ label: string; value: BudgetPeriod }> = [
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
]

const getTabFromUrl = (value: string | null): MonitoringTab =>
  value === 'goals' ? 'goals' : 'budgets'

const formatPeriod = (period: BudgetPeriod) =>
  period.charAt(0).toUpperCase() + period.slice(1)

const formatDate = (value: string | null) => {
  if (!value) {
    return 'No target date'
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const getDaysLeftLabel = (daysLeft: number | null) => {
  if (daysLeft === null) {
    return 'Flexible'
  }

  if (daysLeft < 0) {
    return 'Past due'
  }

  if (daysLeft === 0) {
    return 'Due today'
  }

  return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`
}

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

  const handleTabChange = (tab: MonitoringTab) => {
    setSearchParams({ tab })
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
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-pink-500">
              Monitoring
            </p>
            <h1 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
              Budgets & Goals
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-gray-500 sm:text-base">
              Keep spending limits and savings targets visible before they drift.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              activeTab === 'budgets'
                ? setBudgetModal({ mode: 'create', budget: null })
                : setGoalModal({ mode: 'create', goal: null })
            }
            className="flex items-center justify-center gap-2 rounded-[2rem] bg-pink-500 px-7 py-4 font-black text-white transition hover:bg-pink-600"
          >
            <Plus className="h-5 w-5" aria-hidden="true" />
            {activeTab === 'budgets' ? 'New Budget' : 'New Goal'}
          </button>
        </header>

        {error ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-600">
            {error}
          </div>
        ) : null}

        <SummaryGrid
          budgetCount={budgets.length}
          goalCount={goals.length}
          linkedGoalCount={linkedGoalCount}
          loading={loading}
          summary={summary}
        />

        <section className="flex flex-col gap-4 rounded-[2.5rem] border border-pink-50 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex gap-2 rounded-[2rem] bg-pink-50 p-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-[1.4rem] px-5 py-3 text-sm font-black transition sm:flex-none ${
                    active
                      ? 'bg-white text-pink-600 shadow-sm'
                      : 'text-gray-400 hover:text-pink-500'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {tab.label}
                </button>
              )
            })}
          </div>
          <p className="px-3 text-xs font-bold uppercase tracking-widest text-gray-400">
            {activeTab === 'budgets'
              ? `${budgets.length} spending limit${budgets.length === 1 ? '' : 's'}`
              : `${goals.length} savings target${goals.length === 1 ? '' : 's'}`}
          </p>
        </section>

        {activeTab === 'budgets' ? (
          <BudgetsPanel
            budgets={budgets}
            deletingId={deletingId}
            loading={loading}
            onCreate={() => setBudgetModal({ mode: 'create', budget: null })}
            onDelete={handleDeleteBudget}
            onEdit={(budget) => setBudgetModal({ mode: 'edit', budget })}
          />
        ) : (
          <GoalsPanel
            deletingId={deletingId}
            goals={goals}
            loading={loading}
            onCreate={() => setGoalModal({ mode: 'create', goal: null })}
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

function SummaryGrid({
  budgetCount,
  goalCount,
  linkedGoalCount,
  loading,
  summary,
}: {
  budgetCount: number
  goalCount: number
  linkedGoalCount: number
  loading: boolean
  summary: ReturnType<typeof useMonitoringData>['summary']
}) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        icon={Gauge}
        label="Budget Used"
        value={loading ? '...' : `${summary.averageBudgetProgress}%`}
        detail={
          loading
            ? 'Loading limits'
            : `${compactCurrency.format(summary.budgetSpentTotal)} of ${compactCurrency.format(summary.budgetLimitTotal)}`
        }
      />
      <SummaryCard
        icon={Target}
        label="Goal Progress"
        value={loading ? '...' : `${summary.averageGoalProgress}%`}
        detail={
          loading
            ? 'Loading goals'
            : `${compactCurrency.format(summary.goalCurrentTotal)} saved`
        }
      />
      <SummaryCard
        icon={Flag}
        label="Active Plans"
        value={loading ? '...' : String(budgetCount + goalCount)}
        detail={`${budgetCount} budgets, ${goalCount} goals`}
      />
      <SummaryCard
        icon={WalletCards}
        label="Linked Goals"
        value={loading ? '...' : String(linkedGoalCount)}
        detail={`${summary.dueSoonGoals} due in 30 days`}
      />
    </section>
  )
}

function SummaryCard({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <article className="flex min-h-32 items-center gap-4 rounded-[2rem] border border-pink-50 bg-white p-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-500">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
          {label}
        </p>
        <p className="truncate text-2xl font-black text-gray-900">{value}</p>
        <p className="mt-1 truncate text-xs font-bold text-gray-400">{detail}</p>
      </div>
    </article>
  )
}

function BudgetsPanel({
  budgets,
  deletingId,
  loading,
  onCreate,
  onDelete,
  onEdit,
}: {
  budgets: Budget[]
  deletingId: string | null
  loading: boolean
  onCreate: () => void
  onDelete: (budget: Budget) => void
  onEdit: (budget: Budget) => void
}) {
  if (loading) {
    return <CardSkeletonGrid />
  }

  if (!budgets.length) {
    return (
      <EmptyPanel
        actionLabel="Create Budget"
        description="Choose expense categories and set limits to monitor spending."
        icon={ReceiptText}
        title="No budgets yet"
        onAction={onCreate}
      />
    )
  }

  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {budgets.map((budget) => (
        <BudgetCard
          key={budget.id}
          budget={budget}
          deleting={deletingId === budget.id}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </section>
  )
}

function BudgetCard({
  budget,
  deleting,
  onDelete,
  onEdit,
}: {
  budget: Budget
  deleting: boolean
  onDelete: (budget: Budget) => void
  onEdit: (budget: Budget) => void
}) {
  const overBudget = budget.remainingAmount < 0
  const progressColor = overBudget ? 'bg-rose-500' : 'bg-pink-500'
  const categoryColor = budget.category?.color ?? '#ec4899'

  return (
    <article className="rounded-[2rem] border border-pink-50 bg-white p-6 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-100/70">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: categoryColor }}
          >
            <ReceiptText className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-xl font-black text-gray-900">
              {budget.category?.name ?? 'Uncategorized'}
            </h3>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
              {formatPeriod(budget.period)} limit
            </p>
          </div>
        </div>
        <ActionButtons
          deleting={deleting}
          deleteLabel="Delete budget"
          editLabel="Edit budget"
          onDelete={() => onDelete(budget)}
          onEdit={() => onEdit(budget)}
        />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <MetricBox label="Spent" value={currency.format(budget.spentAmount)} />
        <MetricBox label="Limit" value={currency.format(budget.limitAmount)} />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
          Usage
        </p>
        <p
          className={`text-sm font-black ${
            overBudget ? 'text-rose-500' : 'text-pink-600'
          }`}
        >
          {budget.progress}%
        </p>
      </div>
      <div className="h-3 overflow-hidden rounded-full border border-pink-100 bg-pink-50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
          style={{ width: `${budget.progress}%` }}
        />
      </div>

      <p
        className={`mt-4 text-sm font-bold ${
          overBudget ? 'text-rose-500' : 'text-gray-500'
        }`}
      >
        {overBudget
          ? `Over by ${currency.format(Math.abs(budget.remainingAmount))}`
          : `${currency.format(budget.remainingAmount)} remaining`}
      </p>
    </article>
  )
}

function GoalsPanel({
  deletingId,
  goals,
  loading,
  onCreate,
  onDelete,
  onEdit,
}: {
  deletingId: string | null
  goals: Goal[]
  loading: boolean
  onCreate: () => void
  onDelete: (goal: Goal) => void
  onEdit: (goal: Goal) => void
}) {
  if (loading) {
    return <CardSkeletonGrid />
  }

  if (!goals.length) {
    return (
      <EmptyPanel
        actionLabel="Create Goal"
        description="Set target amounts and optionally link them to an account balance."
        icon={Target}
        title="No goals yet"
        onAction={onCreate}
      />
    )
  }

  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {goals.map((goal) => (
        <GoalCard
          key={goal.id}
          deleting={deletingId === goal.id}
          goal={goal}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}
    </section>
  )
}

function GoalCard({
  deleting,
  goal,
  onDelete,
  onEdit,
}: {
  deleting: boolean
  goal: Goal
  onDelete: (goal: Goal) => void
  onEdit: (goal: Goal) => void
}) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-pink-50 bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-pink-100/70">
      <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-6 text-white">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-2xl font-black tracking-tight">
              {goal.name}
            </h3>
            <p className="mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-pink-100">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              {getDaysLeftLabel(goal.daysLeft)}
            </p>
          </div>
          <ActionButtons
            deleting={deleting}
            deleteLabel="Delete goal"
            editLabel="Edit goal"
            light
            onDelete={() => onDelete(goal)}
            onEdit={() => onEdit(goal)}
          />
        </div>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-pink-100">
              Saved
            </p>
            <p className="text-3xl font-black">
              {compactCurrency.format(goal.currentAmount)}
            </p>
          </div>
          <p className="rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-widest">
            {goal.progress}%
          </p>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="h-3 overflow-hidden rounded-full border border-pink-100 bg-pink-50">
          <div
            className="h-full rounded-full bg-pink-500 transition-all duration-500"
            style={{ width: `${goal.progress}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MetricBox label="Target" value={currency.format(goal.targetAmount)} />
          <MetricBox
            label="Remaining"
            value={currency.format(goal.remainingAmount)}
          />
        </div>
        <div className="rounded-2xl border border-pink-50 bg-pink-50/50 p-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Tracking Source
          </p>
          <p className="mt-1 truncate text-sm font-black text-gray-800">
            {goal.linkedAccount
              ? `${goal.linkedAccount.name} balance`
              : 'Manual saved amount'}
          </p>
          <p className="mt-1 text-xs font-bold text-gray-400">
            Target date: {formatDate(goal.targetDate)}
          </p>
        </div>
      </div>
    </article>
  )
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-pink-50 bg-pink-50/50 p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
        {label}
      </p>
      <p className="mt-1 truncate text-base font-black text-gray-900">{value}</p>
    </div>
  )
}

function ActionButtons({
  deleteLabel,
  deleting,
  editLabel,
  light = false,
  onDelete,
  onEdit,
}: {
  deleteLabel: string
  deleting: boolean
  editLabel: string
  light?: boolean
  onDelete: () => void
  onEdit: () => void
}) {
  const buttonClass = light
    ? 'bg-white/15 text-white hover:bg-white/25 disabled:opacity-40'
    : 'border border-pink-50 bg-white text-gray-300 hover:bg-pink-50 hover:text-pink-600 disabled:opacity-40'

  return (
    <div className="flex shrink-0 gap-1">
      <button
        type="button"
        onClick={onEdit}
        disabled={deleting}
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${buttonClass}`}
        aria-label={editLabel}
        title={editLabel}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${buttonClass}`}
        aria-label={deleteLabel}
        title={deleteLabel}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

function EmptyPanel({
  actionLabel,
  description,
  icon: Icon,
  onAction,
  title,
}: {
  actionLabel: string
  description: string
  icon: LucideIcon
  onAction: () => void
  title: string
}) {
  return (
    <section className="rounded-[2.5rem] border-2 border-dashed border-pink-200/70 bg-white px-6 py-20 text-center">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-pink-50 text-pink-500">
        <Icon className="h-10 w-10" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-black uppercase tracking-widest text-gray-500">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm font-medium text-gray-400">
        {description}
      </p>
      <button
        type="button"
        onClick={onAction}
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-[2rem] bg-pink-500 px-7 py-4 font-black text-white transition hover:bg-pink-600"
      >
        <Plus className="h-5 w-5" aria-hidden="true" />
        {actionLabel}
      </button>
    </section>
  )
}

function CardSkeletonGrid() {
  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-72 animate-pulse rounded-[2rem] border border-pink-50 bg-white p-6"
        >
          <div className="mb-8 h-12 w-2/3 rounded-2xl bg-pink-50" />
          <div className="mb-4 h-20 rounded-2xl bg-pink-50/70" />
          <div className="h-3 rounded-full bg-pink-50" />
        </div>
      ))}
    </section>
  )
}

function BudgetModal({
  budget,
  categories,
  mode,
  onClose,
  onSubmit,
  saving,
}: {
  budget: Budget | null
  categories: MonitoringCategory[]
  mode: ModalMode
  onClose: () => void
  onSubmit: (values: BudgetFormValues) => Promise<boolean>
  saving: boolean
}) {
  const [categoryId, setCategoryId] = useState(budget?.categoryId ?? '')
  const [limitAmount, setLimitAmount] = useState(
    budget ? String(budget.limitAmount) : '',
  )
  const [period, setPeriod] = useState<BudgetPeriod>(budget?.period ?? 'monthly')
  const [formError, setFormError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    const result = budgetSchema.safeParse({
      categoryId,
      limitAmount,
      period,
    })

    if (!result.success) {
      const message = getZodErrorMessage(result.error, 'Invalid budget.')
      setFormError(message)
      alerts.warning(message)
      return
    }

    await onSubmit(result.data)
  }

  return (
    <ModalShell
      saving={saving}
      title={mode === 'edit' ? 'Edit Budget' : 'New Budget'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError ? <FormError message={formError} /> : null}
        <div>
          <label
            htmlFor="budget-category"
            className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400"
          >
            Category
          </label>
          <select
            id="budget-category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
          >
            <option value="">Choose expense category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="budget-limit"
              className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400"
            >
              Limit
            </label>
            <input
              id="budget-limit"
              type="number"
              min="0"
              step="0.01"
              value={limitAmount}
              onChange={(event) => setLimitAmount(event.target.value)}
              className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
              placeholder="0.00"
            />
          </div>
          <div>
            <label
              htmlFor="budget-period"
              className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400"
            >
              Period
            </label>
            <select
              id="budget-period"
              value={period}
              onChange={(event) => setPeriod(event.target.value as BudgetPeriod)}
              className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <ModalActions
          saving={saving}
          submitLabel={mode === 'edit' ? 'Save Budget' : 'Create Budget'}
          waitingLabel={mode === 'edit' ? 'Saving...' : 'Creating...'}
          onClose={onClose}
        />
      </form>
    </ModalShell>
  )
}

function GoalModal({
  accounts,
  goal,
  mode,
  onClose,
  onSubmit,
  saving,
}: {
  accounts: Account[]
  goal: Goal | null
  mode: ModalMode
  onClose: () => void
  onSubmit: (values: GoalFormValues) => Promise<boolean>
  saving: boolean
}) {
  const initialLinkedValue = goal?.linkedCardId
    ? `card:${goal.linkedCardId}`
    : goal?.linkedWalletId
      ? `wallet:${goal.linkedWalletId}`
      : 'none'
  const [name, setName] = useState(goal?.name ?? '')
  const [targetAmount, setTargetAmount] = useState(
    goal ? String(goal.targetAmount) : '',
  )
  const [currentAmount, setCurrentAmount] = useState(
    goal ? String(goal.currentAmount) : '0',
  )
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? '')
  const [linkedValue, setLinkedValue] = useState(initialLinkedValue)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    const [linkedKind, linkedId] = linkedValue.split(':')
    const result = goalSchema.safeParse({
      currentAmount,
      linkedCardId: linkedKind === 'card' ? linkedId : null,
      linkedWalletId: linkedKind === 'wallet' ? linkedId : null,
      name,
      targetAmount,
      targetDate: targetDate || null,
    })

    if (!result.success) {
      const message = getZodErrorMessage(result.error, 'Invalid goal.')
      setFormError(message)
      alerts.warning(message)
      return
    }

    await onSubmit(result.data)
  }

  return (
    <ModalShell
      saving={saving}
      title={mode === 'edit' ? 'Edit Goal' : 'New Goal'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {formError ? <FormError message={formError} /> : null}
        <div>
          <label
            htmlFor="goal-name"
            className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400"
          >
            Goal Name
          </label>
          <input
            id="goal-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
            placeholder="Emergency fund"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="goal-target"
              className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400"
            >
              Target
            </label>
            <input
              id="goal-target"
              type="number"
              min="0"
              step="0.01"
              value={targetAmount}
              onChange={(event) => setTargetAmount(event.target.value)}
              className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
              placeholder="0.00"
            />
          </div>
          <div>
            <label
              htmlFor="goal-current"
              className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400"
            >
              Saved
            </label>
            <input
              id="goal-current"
              type="number"
              min="0"
              step="0.01"
              value={currentAmount}
              onChange={(event) => setCurrentAmount(event.target.value)}
              className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="goal-link"
            className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400"
          >
            Tracking Source
          </label>
          <select
            id="goal-link"
            value={linkedValue}
            onChange={(event) => setLinkedValue(event.target.value)}
            className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
          >
            <option value="none">Manual saved amount</option>
            {accounts.map((account) => {
              const kind = account.kind === 'card' ? 'card' : 'wallet'

              return (
                <option key={`${kind}:${account.id}`} value={`${kind}:${account.id}`}>
                  {account.name} - {currency.format(account.balance)}
                </option>
              )
            })}
          </select>
        </div>
        <div>
          <label
            htmlFor="goal-date"
            className="mb-2 block text-xs font-black uppercase tracking-widest text-gray-400"
          >
            Target Date
          </label>
          <input
            id="goal-date"
            type="date"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            className="w-full rounded-2xl border border-pink-100 bg-pink-50/50 px-5 py-4 text-sm font-bold text-gray-700 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10"
          />
        </div>
        <ModalActions
          saving={saving}
          submitLabel={mode === 'edit' ? 'Save Goal' : 'Create Goal'}
          waitingLabel={mode === 'edit' ? 'Saving...' : 'Creating...'}
          onClose={onClose}
        />
      </form>
    </ModalShell>
  )
}

function ModalShell({
  children,
  onClose,
  saving,
  title,
}: {
  children: React.ReactNode
  onClose: () => void
  saving: boolean
  title: string
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
        aria-label="Close monitoring form"
      />
      <section className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[2.5rem] border border-pink-100 bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-gray-400 transition hover:text-pink-600 disabled:opacity-50"
            aria-label="Close monitoring form"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </section>
    </div>
  )
}

function ModalActions({
  onClose,
  saving,
  submitLabel,
  waitingLabel,
}: {
  onClose: () => void
  saving: boolean
  submitLabel: string
  waitingLabel: string
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-3">
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="rounded-2xl border border-pink-100 px-6 py-3 text-sm font-black text-gray-500 transition hover:bg-pink-50 disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="rounded-2xl bg-pink-500 px-7 py-3 text-sm font-black text-white transition hover:bg-pink-600 disabled:opacity-50"
      >
        {saving ? waitingLabel : submitLabel}
      </button>
    </div>
  )
}

function FormError({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
      {message}
    </div>
  )
}
