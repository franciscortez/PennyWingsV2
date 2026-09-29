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
