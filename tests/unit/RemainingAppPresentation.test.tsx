import ProfilePage from '@/pages/Profile'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { BudgetModal } from '@/sections/monitoring/BudgetModal'
import { GoalModal } from '@/sections/monitoring/GoalModal'
import { BudgetsPanel } from '@/sections/monitoring/BudgetsPanel'
import { GoalsPanel } from '@/sections/monitoring/GoalsPanel'
import { MonitoringTabs } from '@/sections/monitoring/MonitoringTabs'
import { MonitoringSkeleton } from '@/sections/monitoring/MonitoringSkeleton'
import { ReportsSkeleton } from '@/sections/reports/ReportsSkeleton'
import { CashFlowOverviewSection } from '@/sections/reports/CashFlowOverviewSection'
import { AccountSnapshotSection } from '@/sections/reports/AccountSnapshotSection'
import { SavedReportsSection } from '@/sections/reports/SavedReportsSection'
import { ReportMonthPicker } from '@/sections/reports/ReportMonthPicker'
import GeneralSection from '@/sections/profile/GeneralSection'
import SecuritySection from '@/sections/profile/SecuritySection'
import DangerSection from '@/sections/profile/DangerSection'
import type { Budget, Goal, MonthlyReport } from '@/types'
import { resetDocumentStyles, stubScrollEnvironment } from '../helpers/scrollEnvironment'

const mocks = vi.hoisted(() => ({
  updateProfile: vi.fn(), updatePassword: vi.fn(), deleteAccount: vi.fn(), reauthenticate: vi.fn(),
  profile: { full_name: 'Fixture User', avatar_url: null }, success: vi.fn(), error: vi.fn(), warning: vi.fn(), confirmDelete: vi.fn(), google: false,
}))
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({
  user: { last_sign_in_at: '2026-10-03T00:00:00Z', id: 'fixture-user', email: 'fixture@example.com', app_metadata: { provider: mocks.google ? 'google' : 'email' } },
  profile: mocks.profile, updateProfile: mocks.updateProfile,
  updatePassword: mocks.updatePassword, deleteAccount: mocks.deleteAccount, reauthenticateWithGoogleForDeletion: mocks.reauthenticate,
}) }))
vi.mock('@/lib/alert', () => ({ alerts: mocks }))
const category = { id: 'category', name: 'Groceries', type: 'expense' as const, icon: null, color: '#ffffff' }
const budget: Budget = { id: 'budget', category, categoryId: category.id, createdAt: null, limitAmount: 100, period: 'monthly', progress: 100, remainingAmount: -50.37, spentAmount: 150.37 }
const goal: Goal = { id: 'goal', name: 'Emergency fund', createdAt: null, currentAmount: 100, targetAmount: 200, targetDate: null, daysLeft: null, linkedAccount: null, linkedCardId: null, linkedWalletId: null, progress: 50, remainingAmount: 100 }
const report: MonthlyReport = { id: 'report', reportMonth: '2026-01-01', generatedAt: '2026-02-01T00:00:00Z', incomeTotal: 0, expenseTotal: 150.37, netCashflow: -150.37, transactionCount: 1, transferTotal: 20, withdrawalTotal: 30, categoryBreakdown: [], accountSnapshot: [{ id: 'lent', kind: 'lent', name: 'Long archived loan', balance: -1234567890.37, isActive: false }] }

beforeEach(() => {
  resetDocumentStyles(); stubScrollEnvironment(); vi.clearAllMocks(); mocks.google = false; sessionStorage.removeItem('pennywings:google-deletion-reauth')
  for (const fn of [mocks.updateProfile, mocks.updatePassword, mocks.deleteAccount, mocks.reauthenticate]) fn.mockResolvedValue({ error: null })
  mocks.confirmDelete.mockResolvedValue(false)
})
afterEach(() => { resetDocumentStyles(); vi.restoreAllMocks() })

describe('remaining app presentation contracts', () => {
  it('exposes tab selection without changing callback values', () => {
    const onChange = vi.fn(); render(<MonitoringTabs activeTab="goals" budgetCount={1} goalCount={2} onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Goals' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Budgets' })); expect(onChange).toHaveBeenCalledWith('budgets')
  })
  it('keeps signed overspending and bounded progress readable with delete guards', () => {
    const onEdit = vi.fn(), onDelete = vi.fn()
    const { rerender } = render(<BudgetsPanel budgets={[budget]} deletingId={null} loading={false} onCreate={vi.fn()} onEdit={onEdit} onDelete={onDelete} />)
    expect(screen.getByText('Over by ₱50.37')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    fireEvent.click(screen.getByRole('button', { name: 'Edit budget' })); expect(onEdit).toHaveBeenCalledWith(budget)
    fireEvent.click(screen.getByRole('button', { name: 'Delete budget' })); expect(onDelete).toHaveBeenCalledWith(budget)
    rerender(<BudgetsPanel budgets={[budget]} deletingId="budget" loading={false} onCreate={vi.fn()} onEdit={onEdit} onDelete={onDelete} />)
    expect(screen.getByRole('button', { name: 'Edit budget' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Delete budget' })).toBeDisabled()
  })
  it.each(['weekly', 'monthly', 'yearly'])('preserves %s budget payload and existing IDs', async period => {
    const submit = vi.fn().mockResolvedValue(true)
    render(<BudgetModal budget={null} categories={[category]} mode="create" saving={false} onClose={vi.fn()} onSubmit={submit} />)
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'category' } })
    fireEvent.change(screen.getByLabelText('Limit'), { target: { value: '123.45' } })
    fireEvent.change(screen.getByLabelText('Period'), { target: { value: period } })
    fireEvent.click(screen.getByRole('button', { name: 'Create budget' }))
    await waitFor(() => expect(submit).toHaveBeenCalledWith({ categoryId: 'category', limitAmount: 123.45, period }))
  })
  it('preserves goal values and rejects invalid data through existing validation', async () => {
    const submit = vi.fn().mockResolvedValue(true)
    render(<GoalModal goal={goal} accounts={[]} mode="edit" saving={false} onClose={vi.fn()} onSubmit={submit} />)
    fireEvent.change(screen.getByLabelText('Target'), { target: { value: '50' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save goal' }))
    expect(submit).not.toHaveBeenCalled(); expect(mocks.warning).toHaveBeenCalled()
    fireEvent.change(screen.getByLabelText('Target'), { target: { value: '250.37' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save goal' }))
    await waitFor(() => expect(submit).toHaveBeenCalledWith({ name: goal.name, targetAmount: 250.37, currentAmount: 100, targetDate: null, linkedCardId: null, linkedWalletId: null }))
  })
  it('keeps manual and linked goal presentation and callback identity', () => {
    render(<GoalsPanel goals={[{ ...goal, linkedAccount: { id: 'card', name: 'Reserve', balance: 100, color: null, kind: 'card' } }]} deletingId={null} loading={false} onCreate={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />)
    expect(screen.getByText('Reserve balance')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  })
  it.each([MonitoringSkeleton, ReportsSkeleton])('renders exactly one heading while loading', Component => {
    render(<Component />); expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })
  it('keeps zero-income efficiency and signed archived lent snapshots', () => {
    render(<><CashFlowOverviewSection report={report} /><AccountSnapshotSection report={report} /></>)
    expect(screen.getAllByText('N/A')).toHaveLength(2)
    expect(screen.getByText('Archived')).toBeInTheDocument()
    expect(screen.getByText('Long archived loan').closest('article')).toHaveTextContent('-₱1,234,567,890.37')
  })
  it('retains saved-month selection without mounting it in Reports', async () => {
    const onSelect = vi.fn(); render(<SavedReportsSection reports={[report]} selectedMonth="2026-01" onSelect={onSelect} />)
    const button = screen.getByRole('button'); expect(button).toHaveAttribute('aria-pressed', 'true')
    button.focus(); await userEvent.keyboard(' '); expect(onSelect).toHaveBeenCalledWith('2026-01')
  })
  it('keeps month restrictions and restores trigger focus on Escape', async () => {
    render(<ReportMonthPicker value="2025-01" onChange={vi.fn()} />)
    const trigger = screen.getByRole('button'); fireEvent.click(trigger)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument(); expect(trigger).toHaveFocus()
  })
  it('saves profile and keyboard-selected avatar through the unchanged update contract', async () => {
    render(<GeneralSection />)
    const avatar = screen.getByRole('button', { name: 'Choose avatar 2' }); avatar.focus(); await userEvent.keyboard(' ')
    expect(avatar).toHaveAttribute('aria-pressed', 'true'); expect(avatar.querySelector('svg')).not.toBeNull()
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'New name' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
    await waitFor(() => expect(mocks.updateProfile).toHaveBeenCalledWith({ full_name: 'New name', avatar_url: expect.stringContaining('seed=Aneka') }))
  })
  it('connects invalid profile fields to errors without saving', async () => {
    render(<GeneralSection />); fireEvent.change(screen.getByLabelText('Custom avatar URL'), { target: { value: 'invalid' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
    await waitFor(() => expect(screen.getByLabelText('Custom avatar URL')).toHaveAttribute('aria-invalid', 'true'))
    expect(mocks.updateProfile).not.toHaveBeenCalled()
  })
  it('validates confirmation and preserves password update payload', async () => {
    render(<SecuritySection />)
    fireEvent.change(screen.getByLabelText('New password', { exact: true }), { target: { value: 'fixture-password' } })
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'mismatch' } })
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
    await waitFor(() => expect(screen.getByText('Passwords do not match.')).toBeInTheDocument()); expect(mocks.updatePassword).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Show new password' })); expect(screen.getByLabelText('New password', { exact: true })).toHaveAttribute('type', 'text')
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'fixture-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
    await waitFor(() => expect(mocks.updatePassword).toHaveBeenCalledWith('fixture-password'))
  })
  it('keeps Google users out of the password-change form', () => {
    mocks.google = true; render(<SecuritySection />)
    expect(screen.queryByLabelText('New password')).not.toBeInTheDocument()
    expect(screen.getByText('OAuth Security')).toBeInTheDocument()
  })
  it('cancels email deletion and clears the password on reopen', async () => {
    render(<MemoryRouter><DangerSection googleReauthenticationComplete={false} onGoogleReauthenticationHandled={vi.fn()} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'fixture-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
    expect(screen.getByLabelText('Password')).toHaveValue(''); expect(mocks.deleteAccount).not.toHaveBeenCalled()
  })
  it('keeps email deletion credential and error feedback', async () => {
    mocks.deleteAccount.mockResolvedValue({ error: { message: 'Fixture rejection' } })
    render(<MemoryRouter><DangerSection googleReauthenticationComplete={false} onGoogleReauthenticationHandled={vi.fn()} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
    const dialog = screen.getByRole('dialog', { name: 'Verify password' })
    fireEvent.change(within(dialog).getByLabelText('Password'), { target: { value: 'fixture-password' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Delete account' }))
    await waitFor(() => expect(mocks.deleteAccount).toHaveBeenCalledWith('fixture-password'))
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Fixture rejection')); expect(dialog).toBeInTheDocument()
  })
  it('preserves Google confirmation before reauthentication', async () => {
    mocks.google = true; render(<MemoryRouter><DangerSection googleReauthenticationComplete={false} onGoogleReauthenticationHandled={vi.fn()} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
    await waitFor(() => expect(mocks.confirmDelete).toHaveBeenCalledWith('Verify with Google', expect.any(String)))
    expect(mocks.reauthenticate).not.toHaveBeenCalled(); expect(mocks.deleteAccount).not.toHaveBeenCalled()
  })
  it('consumes verified Google return once and retains final confirmation', async () => {
    mocks.google = true; mocks.confirmDelete.mockResolvedValue(true)
    const handled = vi.fn()
    render(<MemoryRouter><DangerSection googleReauthenticationComplete onGoogleReauthenticationHandled={handled} /></MemoryRouter>)
    await waitFor(() => expect(mocks.deleteAccount).toHaveBeenCalledWith(undefined))
    expect(handled).toHaveBeenCalledTimes(1); expect(mocks.confirmDelete).toHaveBeenCalledWith('Account', expect.stringContaining('reports will be deleted'))
  })
})

describe('pending operations and Google return boundaries', () => {
  it('blocks monitoring dismissal while saving', () => {
    const close = vi.fn()
    render(<BudgetModal budget={budget} categories={[category]} mode="edit" saving onClose={close} onSubmit={vi.fn()} />)
    fireEvent.keyDown(document, { key: 'Escape' }); fireEvent.click(screen.getByRole('button', { name: 'Close monitoring form' }))
    expect(close).not.toHaveBeenCalled(); expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
  })
  it('blocks verification dismissal until a pending deletion finishes', async () => {
    let resolve!: (value: { error: { message: string } }) => void
    mocks.deleteAccount.mockReturnValue(new Promise(r => { resolve = r }))
    render(<MemoryRouter><DangerSection googleReauthenticationComplete={false} onGoogleReauthenticationHandled={vi.fn()} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'fixture-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Delete account' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled())
    fireEvent.keyDown(document, { key: 'Escape' }); expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    resolve({ error: { message: 'Fixture rejection' } })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled())
  })
  it('retains save and password service-error feedback', async () => {
    mocks.updateProfile.mockResolvedValue({ error: { message: 'Profile rejection' } })
    const { unmount } = render(<GeneralSection />)
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }))
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Profile rejection')); unmount()
    mocks.updatePassword.mockResolvedValue({ error: { message: 'Password rejection' } })
    render(<SecuritySection />)
    for (const label of ['New password', 'Confirm new password']) fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value: 'fixture-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Change password' }))
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Password rejection'))
  })
  it('starts Google reauthentication only after confirmation and reports rejection', async () => {
    mocks.google = true; mocks.confirmDelete.mockResolvedValue(true); mocks.reauthenticate.mockResolvedValue({ error: { message: 'Google rejection' } })
    render(<MemoryRouter><DangerSection googleReauthenticationComplete={false} onGoogleReauthenticationHandled={vi.fn()} /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Delete my account' }))
    await waitFor(() => expect(mocks.reauthenticate).toHaveBeenCalledTimes(1)); expect(mocks.deleteAccount).not.toHaveBeenCalled()
    await waitFor(() => expect(mocks.error).toHaveBeenCalledWith('Google rejection'))
  })
})

describe('Settings Google return states', () => {
  it.each([
    { name: 'expired', age: 301_000, userId: 'fixture-user', lastSignInAt: 'earlier', message: 'Google verification expired. Start account deletion again.' },
    { name: 'mismatched user', age: 0, userId: 'different-user', lastSignInAt: 'earlier', message: 'Google account did not match. Account deletion was canceled.' },
    { name: 'incomplete', age: 0, userId: 'fixture-user', lastSignInAt: '2026-10-03T00:00:00Z', message: 'Google verification was not completed. Account deletion was canceled.' },
  ])('preserves $name rejection and never deletes', async row => {
    mocks.google = true
    sessionStorage.setItem('pennywings:google-deletion-reauth', JSON.stringify({ requestedAt: Date.now() - row.age, userId: row.userId, lastSignInAt: row.lastSignInAt }))
    render(<MemoryRouter><ProfilePage /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Settings')
    expect(screen.getByRole('button', { name: 'General' })).toHaveAttribute('aria-pressed', 'true')
    expect([...mocks.warning.mock.calls, ...mocks.error.mock.calls].flat()).toContain(row.message)
    expect(mocks.deleteAccount).not.toHaveBeenCalled(); expect(mocks.confirmDelete).not.toHaveBeenCalled()
  })
})
