import { expect, test } from '@playwright/test'

test.describe('Authentication & Route Protection', () => {
  test('redirects unauthenticated user accessing /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*login/)
  })

  test('redirects unauthenticated user accessing /transactions to /login', async ({ page }) => {
    await page.goto('/transactions')
    await expect(page).toHaveURL(/.*login/)
  })

  test('redirects unauthenticated user accessing /accounts to /login', async ({ page }) => {
    await page.goto('/accounts')
    await expect(page).toHaveURL(/.*login/)
  })

  test('shows validation errors on empty login form submission', async ({ page }) => {
    await page.goto('/login')
    const submitButton = page.locator('button[type="submit"]')
    if (await submitButton.isVisible()) {
      await submitButton.click()
      await expect(page.locator('body')).toContainText(/email|password/i)
    }
  })

  test('navigates between login and register pages', async ({ page }) => {
    await page.goto('/login')
    const signUpLink = page.getByRole('link', { name: /start free|sign up|register|create account/i })
    await expect(signUpLink).toBeVisible()
    await signUpLink.click()
    await expect(page).toHaveURL(/.*(signup|register)/)
  })
})

// Issue #69: the auth pages share the landing's shell. Each page keeps one
// h1 and a visible brand mark at every width, renders its back link once,
// and carries no infinite pulse animation.
const authPages = [
  { path: '/login', title: 'Welcome back' },
  { path: '/signup', title: 'Create your account' },
  { path: '/forgot-password', title: 'Reset your password' },
  { path: '/reset-password', title: 'Set a new password' },
]

for (const viewport of [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1280, height: 800 },
]) {
  test.describe(`Auth shell at ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    for (const authPage of authPages) {
      test(`${authPage.path} has one h1, the brand mark and one back link`, async ({ page }) => {
        await page.goto(authPage.path)

        const headings = page.locator('h1')
        await expect(headings).toHaveCount(1)
        await expect(headings).toHaveText(authPage.title)

        await expect(page.getByRole('link', { name: 'PennyWings' })).toBeVisible()
        await expect(page.getByRole('link', { name: /^back to/i })).toHaveCount(1)
        await expect(page.locator('.animate-pulse')).toHaveCount(0)
      })
    }
  })
}

test('login keeps the forgot-password link and Google sign-in button', async ({ page }) => {
  await page.goto('/login')

  await page.getByRole('link', { name: 'Forgot password?' }).click()
  await expect(page).toHaveURL(/.*forgot-password/)

  await page.goto('/login')
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeEnabled()
})

test('signup still requires the terms checkbox', async ({ page }) => {
  await page.goto('/signup')

  await page.getByLabel('Email address').fill('new.user@example.com')
  await page.getByLabel('Password', { exact: true }).fill('secret123')
  await page.getByLabel('Confirm password').fill('secret123')
  await page.getByRole('button', { name: 'Start free' }).click()

  await expect(page.getByText('Please accept the Terms and Agreement.')).toBeVisible()
  await expect(page).toHaveURL(/.*signup/)
})

for (const path of ['/', '/login']) {
  test(`brand logo fits the header at 320px on ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    await page.goto(path)
    const brand = page.locator('header a[href="/"]').first()
    await expect(brand).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    const layout = await brand.evaluate(link => {
      const row = link.parentElement!
      const items = [...row.children].filter(child => child.getClientRects().length && getComputedStyle(child).display !== 'none')
      const boxes = items.map(child => child.getBoundingClientRect())
      const rowStyle = getComputedStyle(row)
      const rowBox = row.getBoundingClientRect()
      const gutterLeft = rowBox.left + parseFloat(rowStyle.paddingLeft)
      const gutterRight = rowBox.right - parseFloat(rowStyle.paddingRight)
      return {
        spill: link.scrollWidth - link.clientWidth,
        brandWidth: Math.round(link.getBoundingClientRect().width),
        // Items stay inside the header's side gutters, not merely on screen.
        outside: boxes.filter(box => box.left < gutterLeft - 0.5 || box.right > gutterRight + 0.5).length,
        overlaps: boxes.slice(1).filter((box, index) => box.left < boxes[index].right - 0.5).length,
        pageWidth: document.documentElement.scrollWidth,
        // Visible text in each header item stays on one line (no wrapped labels).
        wrapped: items.flatMap(item => {
          const walker = document.createTreeWalker(item, NodeFilter.SHOW_TEXT)
          const wrappedText: string[] = []
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (!node.textContent?.trim()) continue
            const range = document.createRange()
            range.selectNodeContents(node)
            const lines = new Set([...range.getClientRects()].filter(rect => rect.width > 1).map(rect => Math.round(rect.top)))
            if (lines.size > 1) wrappedText.push(node.textContent.trim())
          }
          return wrappedText
        }),
      }
    })
    expect(layout.spill, 'brand text overflow').toBeLessThanOrEqual(0)
    expect(layout.outside, `header items outside gutters (brand ${layout.brandWidth}px)`).toBe(0)
    expect(layout.overlaps, 'header items overlapping').toBe(0)
    expect(layout.wrapped, 'wrapped header labels').toEqual([])
    expect(layout.pageWidth).toBe(320)
  })
}

test('auth back link switches to arrow-only exactly where the compact header starts', async ({ page }) => {
  await page.goto('/login')
  const back = page.getByRole('link', { name: 'Back to home' })
  await expect(back).toBeVisible()
  const labelVisible = () => back.locator('span').evaluate(span => span.getBoundingClientRect().width > 1)
  // min-[384px] restores the roomy header, so everything narrower must be arrow-only.
  for (const [width, visible] of [[320, false], [383, false], [384, true]] as const) {
    await page.setViewportSize({ width, height: 640 })
    expect(await labelVisible(), `label visible at ${width}`).toBe(visible)
  }
})
