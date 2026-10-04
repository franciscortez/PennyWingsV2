import { expect, test } from '@playwright/test'
import { setupAuthenticatedMocks } from './helpers/authMock'

test.describe('Debts Page & Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedMocks(page)
  })

  test('navigates to /debts from desktop sidebar and renders summary and debts list', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name.startsWith('Mobile'),
      'Desktop navigation uses desktop browser projects.',
    )

    await page.goto('/dashboard')
    const nav = page.getByRole('navigation', { name: 'Primary desktop navigation' })
    const debtsLink = nav.getByRole('link', { name: 'Debts', exact: true })
    await expect(debtsLink).toBeVisible()
    await debtsLink.click()

    await expect(page).toHaveURL(/\/debts$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Debts' })).toBeVisible()

    // Summary cards visible
    await expect(page.getByText('Total Outstanding')).toBeVisible()
    await expect(page.getByText('Payment Urgency')).toBeVisible()
    await expect(page.getByText('Total Settled')).toBeVisible()

    // Debt card visible
    await expect(page.getByText('Atome')).toBeVisible()
    await expect(page.getByText('Buy Now Pay Later')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Pay' })).toBeVisible()
  })

  test('opens and submits Add Debt modal', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name.startsWith('Mobile'),
      'Desktop interactions use desktop browser projects.',
    )

    await page.goto('/debts')
    await page.getByRole('button', { name: 'Add Debt' }).click()

    const dialog = page.getByRole('dialog', { name: 'Add New Debt' })
    await expect(dialog).toBeVisible()

    // Fill form
    await dialog.getByLabel('Provider or Creditor Name').fill('Billease')
    await dialog.getByLabel('Total Amount (PHP)').fill('4500')
    await dialog.getByRole('button', { name: 'Create Debt' }).click()

    // Verify modal closes
    await expect(dialog).not.toBeVisible()
  })

  test('opens and completes Pay Debt modal flow', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name.startsWith('Mobile'),
      'Desktop interactions use desktop browser projects.',
    )

    await page.goto('/debts')
    await page.getByRole('button', { name: 'Pay' }).first().click()

    const dialog = page.getByRole('dialog', { name: /Repay/i })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Remaining Balance')

    // Select source account
    await dialog.getByText('BDO Debit').click()

    // Confirm repayment
    const confirmBtn = dialog.getByRole('button', { name: 'Confirm Repayment' })
    await expect(confirmBtn).not.toBeDisabled()
    await confirmBtn.click()

    await expect(dialog).not.toBeVisible()
  })

  test('adds a purchase to an existing provider and shows the new balance preview', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name.startsWith('Mobile'),
      'Desktop interactions use desktop browser projects.',
    )

    await page.goto('/debts')
    await page.getByRole('button', { name: 'Add purchase' }).first().click()

    const dialog = page.getByRole('dialog', { name: /Add Purchase: Atome/i })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('₱2,500.00')

    await dialog.getByLabel('Purchase Amount (PHP)').fill('50')
    await expect(dialog).toContainText('₱2,550.00')

    await dialog.getByRole('button', { name: 'Add Purchase', exact: true }).click()
    await expect(dialog).not.toBeVisible()
  })

  test('shows purchases in the activity history', async ({ page }, testInfo) => {
    test.skip(
      testInfo.project.name.startsWith('Mobile'),
      'Desktop interactions use desktop browser projects.',
    )

    await page.goto('/debts')
    await page.getByRole('button', { name: 'History', exact: true }).first().click()

    const dialog = page.getByRole('dialog', { name: /Activity: Atome/i })
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('+₱2,000.00')
    await expect(dialog).toContainText('+₱3,000.00')
  })

  test('navigates to /debts via mobile More sheet', async ({ page }, testInfo) => {
    test.skip(
      !testInfo.project.name.startsWith('Mobile'),
      'Mobile navigation uses mobile browser projects.',
    )

    await page.goto('/dashboard')
    const moreBtn = page.getByRole('button', { name: 'Open more navigation' })
    await expect(moreBtn).toBeVisible()
    await moreBtn.click()

    const morePanel = page.locator('#mobile-more-panel')
    await expect(morePanel).toBeVisible()

    const debtsLink = morePanel.getByRole('link', { name: /Debts/i })
    await expect(debtsLink).toBeVisible()
    await debtsLink.click()

    await expect(page).toHaveURL(/\/debts$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Debts' })).toBeVisible()
  })
})
