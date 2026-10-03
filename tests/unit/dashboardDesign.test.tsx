import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { CardsSection } from '@/sections/dashboard/CardsSection'
import { DashboardSkeleton } from '@/sections/dashboard/DashboardSkeleton'
import { MiniStatsSection } from '@/sections/dashboard/MiniStatsSection'
import { ProgressOverviewSection } from '@/sections/dashboard/ProgressOverviewSection'

describe('dashboard presentation contracts', () => {
  it.each([0, 121045.04, -121045.04, 999999999999.99])('preserves every formatted balance digit for %s', balance => {
    render(<MemoryRouter><CardsSection loading={false} monthlyStats={{ income: 12345.67, expenses: 4567.89 }} savingsRate={-25} totalBalance={balance} /></MemoryRouter>)
    expect(document.querySelector('[data-dashboard-balance]')).toHaveTextContent(new Intl.NumberFormat('en-PH', { currency: 'PHP', minimumFractionDigits: 2, style: 'currency' }).format(balance))
    expect(screen.getByText('-25%')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Accounts' })).toHaveAttribute('href', '/accounts')
    expect(screen.getByRole('link', { name: 'Activity' })).toHaveAttribute('href', '/transactions')
    expect(screen.getByText((_, element) => element?.tagName === 'P' && element.textContent === '₱12,346')).toBeVisible()
    expect(screen.getByText((_, element) => element?.tagName === 'P' && element.textContent === '₱4,568')).toBeVisible()
  })
  it('preserves progress values and destinations', () => {
    render(<MemoryRouter><ProgressOverviewSection progress={{ budget: 0, goals: 100 }} /></MemoryRouter>)
    expect(screen.getByRole('progressbar', { name: 'Budget Status' })).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByRole('progressbar', { name: 'Savings Goals' })).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByRole('link', { name: /Budget Status/ })).toHaveAttribute('href', '/monitoring?tab=budgets')
    expect(screen.getByRole('link', { name: /Savings Goals/ })).toHaveAttribute('href', '/monitoring?tab=goals')
  })
  it('retains full profile content and numeric counts', () => {
    const profile = 'Very long profile name '.repeat(12)
    render(<MiniStatsSection loading={false} accountCount={11} transactionCount={5} profileLabel={profile} />)
    expect(screen.getByText(profile.trim())).toHaveTextContent(profile.trim())
    expect(screen.getByText('11')).toBeVisible()
    expect(screen.getByText('5')).toBeVisible()
  })
  it('retains one page heading and an announced loading state', () => {
    render(<DashboardSkeleton />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByLabelText('Loading dashboard')).toHaveAttribute('aria-busy', 'true')
  })
})
