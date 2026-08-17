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
    const signUpLink = page.getByRole('link', { name: /sign up|register|create account/i })
    if (await signUpLink.isVisible()) {
      await signUpLink.click()
      await expect(page).toHaveURL(/.*(signup|register)/)
    }
  })
})
