import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TransactionsSkeleton } from '@/sections/transactions/TransactionsSkeleton'

describe('TransactionsSkeleton UI Component', () => {
  it('renders with accessibility loading label and busy status', () => {
    render(<TransactionsSkeleton />)
    const skeleton = screen.getByLabelText(/loading transactions/i)
    expect(skeleton).toBeInTheDocument()
    expect(skeleton).toHaveAttribute('aria-busy', 'true')
  })

  it('renders skeleton items for both mobile and desktop views', () => {
    const { container } = render(<TransactionsSkeleton />)
    expect(container.querySelector('.animate-pulse')).toBeNull()
    expect(container.querySelector('[class~="motion-safe:animate-pulse"]')).not.toBeNull()
    const rows = container.querySelector('section:last-child > div')
    expect(rows?.children).toHaveLength(5)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })
})
