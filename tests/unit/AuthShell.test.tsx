import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { AuthShell } from '@/sections/auth'
import { authPanels } from '@/sections/auth/authContent'

const renderShell = (props: Partial<Parameters<typeof AuthShell>[0]> = {}) =>
  render(
    <MemoryRouter>
      <AuthShell
        title="Welcome back"
        subtitle="Sign in to pick up where your ledger left off."
        panel={authPanels.login}
        {...props}
      >
        <form aria-label="Sign in form" />
      </AuthShell>
    </MemoryRouter>,
  )

describe('AuthShell', () => {
  it('renders the form title as the only h1', () => {
    renderShell()

    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent('Welcome back')
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0)
  })

  it('keeps the brand mark link to home and renders the back link once', () => {
    renderShell({ backTo: '/login', backLabel: 'Back to sign in' })

    expect(screen.getByRole('link', { name: 'PennyWings' })).toHaveAttribute('href', '/')
    const backLinks = screen.getAllByRole('link', { name: 'Back to sign in' })
    expect(backLinks).toHaveLength(1)
    expect(backLinks[0]).toHaveAttribute('href', '/login')
  })

  it('renders the panel copy and its points', () => {
    renderShell({ panel: authPanels.recovery })

    const panel = screen.getByRole('complementary', { name: 'About PennyWings' })
    expect(panel).toHaveTextContent(authPanels.recovery.headline)
    const items = within(within(panel).getByRole('list')).getAllByRole('listitem')
    expect(items).toHaveLength(authPanels.recovery.points.length)
    expect(panel.querySelector('ol')).not.toBeNull()
  })

  it('has no infinite pulse animation', () => {
    const { container } = renderShell()

    expect(container.querySelector('.animate-pulse')).toBeNull()
  })
})

describe('auth panel copy', () => {
  const strings = Object.values(authPanels).flatMap((panel) => [
    panel.headline,
    panel.body,
    ...panel.points.flatMap((point) => [point.title, point.body]),
  ])

  it('never uses em or en dashes', () => {
    for (const text of strings) {
      expect(text).not.toMatch(/[–—]/)
    }
  })

  it('drops the unverifiable claims the old pages made', () => {
    const banned = [
      /bank-level/i,
      /seamless/i,
      /thousands of users/i,
      /real-time/i,
      /alerts? before you overspend/i,
      /encrypt/i,
    ]

    for (const text of strings) {
      for (const pattern of banned) {
        expect(text).not.toMatch(pattern)
      }
    }
  })
})
