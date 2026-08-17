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
    // Check that pulsing elements exist
    const pulseContainer = container.querySelector('.animate-pulse')
    expect(pulseContainer).not.toBeNull()

    // Verify 5 skeleton rows are rendered
    const skeletonCards = container.querySelectorAll('.space-y-3 > div')
    expect(skeletonCards.length).toBe(5)
  })
})
