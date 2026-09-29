import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { AppButton, PageHeader, PageLoader } from '@/components/ui'
import { fieldInput, fieldTextarea } from '@/components/ui/fieldStyles'

describe('AppButton', () => {
  it('renders the primary variant as a pink-700 pill', () => {
    render(<AppButton type="button">Save</AppButton>)
    const button = screen.getByRole('button', { name: 'Save' })

    expect(button).toHaveClass('rounded-full', 'bg-pink-700', 'font-semibold')
    expect(button).not.toHaveClass('font-black', 'bg-pink-600')
  })

  it('renders a link when given `to`', () => {
    render(
      <MemoryRouter>
        <AppButton to="/dashboard" variant="secondary">
          Dashboard
        </AppButton>
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: 'Dashboard' })

    expect(link).toHaveAttribute('href', '/dashboard')
    expect(link).toHaveClass('text-pink-900')
  })

  it('lets call-site classes win over the base', () => {
    render(
      <AppButton type="button" className="rounded-xl">
        Override
      </AppButton>,
    )
    const button = screen.getByRole('button', { name: 'Override' })

    expect(button).toHaveClass('rounded-xl')
    expect(button).not.toHaveClass('rounded-full')
  })

  it('uses contrast-safe ghost and danger text', () => {
    render(
      <>
        <AppButton type="button" variant="ghost">
          Ghost
        </AppButton>
        <AppButton type="button" variant="danger">
          Delete
        </AppButton>
      </>,
    )

    expect(screen.getByRole('button', { name: 'Ghost' })).toHaveClass('text-slate-600')
    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('text-red-700')
  })
})

describe('PageHeader', () => {
  it('renders exactly one h1 with description and actions', () => {
    render(
      <PageHeader
        title="Accounts"
        description="Every wallet and bank in one place."
        actions={<button type="button">Add account</button>}
      />,
    )

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Accounts')
    expect(screen.getByText('Every wallet and bank in one place.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add account' })).toBeInTheDocument()
  })

  it('omits the description and actions when not given', () => {
    const { container } = render(<PageHeader title="Reports" />)

    expect(container.querySelector('p')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
  })
})

describe('field styles', () => {
  it('builds a pill input and swaps to the error border', () => {
    expect(fieldInput(false)).toContain('rounded-full')
    expect(fieldInput(false)).toContain('border-slate-500')
    expect(fieldInput(true)).toContain('border-red-700')
    expect(fieldInput(true)).not.toContain('border-slate-500')
  })

  it('builds a 20px textarea with dark variants', () => {
    const classes = fieldTextarea(false)

    expect(classes).toContain('rounded-[1.25rem]')
    expect(classes).toContain('dark:bg-slate-900')
  })
})

describe('PageLoader', () => {
  it('keeps its accessible loading label', () => {
    render(<PageLoader />)

    expect(screen.getByLabelText('Loading PennyWings')).toHaveClass('bg-paper')
  })
})
