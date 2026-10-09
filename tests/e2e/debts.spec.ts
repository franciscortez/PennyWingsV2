import { expect, test } from '@playwright/test'
import { setupAuthenticatedMocks } from './helpers/authMock'
import { pickSource } from './helpers/paymentPicker'
import { createDebtReportingFixture } from '../helpers/debtReportingFixture'

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

    // The source account opens its own modal; the repay form steps aside.
    await pickSource(page, dialog, 'Source Account', 'Bank Card', 'BDO Debit')
    await expect(dialog.getByRole('button', { name: /Source Account/ })).toContainText('BDO Debit')

    // Confirm repayment
    const confirmBtn = dialog.getByRole('button', { name: 'Confirm Repayment' })
    await expect(confirmBtn).not.toBeDisabled()
    await confirmBtn.click()

    await expect(dialog).not.toBeVisible()
  })

  test('shows repayments in transactions and dashboard spending and removes reversals', async ({ page }, testInfo) => {
    const fixture = createDebtReportingFixture()
    // Overrides only this test's REST traffic. Auth still uses the shared mocks.
    await page.route('**/rest/v1/**', async route => {
      const request = route.request()
      // The authenticated profile is supplied by setupAuthenticatedMocks.
      if (new URL(request.url()).pathname === '/rest/v1/profiles') return route.fallback()
      const reply = fixture.respond(request.method(), request.url(), request.postDataJSON() ?? {})
      await route.fulfill({
        status: reply.status,
        headers: reply.headers,
        contentType: 'application/json',
        body: request.method() === 'HEAD' ? '' : JSON.stringify(reply.body),
      })
    })
    const navigation = page.getByRole('navigation', {
      name: testInfo.project.name.startsWith('Mobile') ? 'Primary mobile navigation' : 'Primary desktop navigation',
    })
    const navigate = async (path: string) => {
      // Client navigation preserves TanStack caches, so missing invalidation is observable.
      await navigation.locator(`a[href="${path}"]`).click()
      await expect(page).toHaveURL(new RegExp(`${path}$`))
    }
    const assertDashboard = async (balance: string, goalProgress: number, expenses: string, savingsRate: number, entryCount: number) => {
      await expect(page.locator('[data-dashboard-balance]')).toHaveText(balance)
      const overview = page.getByRole('region', { name: 'Financial overview' })
      await expect(overview.getByText('Monthly Expenses').locator('..').locator('..').locator('p').last()).toHaveText(expenses)
      await expect(overview).toContainText(`${savingsRate}%`)
      await expect(page.getByRole('progressbar', { name: 'Budget Status' })).toHaveAttribute('aria-valuenow', '10')
      await expect(page.getByRole('progressbar', { name: 'Savings Goals' })).toHaveAttribute('aria-valuenow', String(goalProgress))
      await expect(page.getByRole('region', { name: 'Account summary' }).getByRole('article').filter({ hasText: 'Latest Entries' }).locator('p')).toHaveText(String(entryCount))
      const calendar = page.locator('.dashboard-calendar')
      await expect(calendar).toContainText(`${expenses} this month`)
      await calendar.getByRole('button', { name: /across/ }).click()
      if (entryCount > 2) {
        await expect(calendar).toContainText('Debt repayment: Atome')
        await expect(calendar).toContainText('Debt Repayment')
      } else {
        await expect(calendar).not.toContainText('Debt repayment: Atome')
      }
    }
    const assertTransactions = async (repaymentCount = 0) => {
      const ledger = page.getByRole('region', { name: 'Transactions', exact: true })
      await expect(ledger.getByRole('button', { name: 'Edit transaction', exact: true })).toHaveCount(2)
      await expect(ledger.getByText('Ordinary groceries', { exact: true }).filter({ visible: true })).toBeVisible()
      await expect(ledger.getByRole('link', { name: 'Manage in Debts', exact: true })).toHaveCount(repaymentCount)
      await expect(ledger.getByText(/^Debt repayment: Atome/).filter({ visible: true })).toHaveCount(repaymentCount)
    }
    const repay = async (amount: string) => {
      await page.getByRole('button', { name: 'Pay', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: /Repay/i })
      await dialog.getByLabel('Payment Amount (PHP)').fill(amount)
      await dialog.getByLabel('Payment Date').fill(fixture.date)
      await dialog.getByLabel('Note or Reference (Optional)').fill('Separate debt installment')
      await pickSource(page, dialog, 'Source Account', 'Bank Card', 'BDO Debit')
      await dialog.getByRole('button', { name: 'Confirm Repayment' }).click()
      await expect(dialog).toBeHidden()
    }

    await page.goto('/dashboard')
    await assertDashboard('₱5,000.00', 50, '₱100', 95, 2)
    await navigate('/transactions')
    await assertTransactions()
    await navigate('/debts')
    await repay('1000')
    await page.getByRole('button', { name: 'History', exact: true }).click()
    let history = page.getByRole('dialog', { name: 'Activity: Atome' })
    await expect(history).toContainText('-₱1,000.00')
    await expect(history).toContainText('Separate debt installment')
    await history.getByRole('button', { name: 'Close', exact: true }).click()
    await navigate('/dashboard')
    await assertDashboard('₱4,000.00', 40, '₱1,100', 45, 3)
    await navigate('/transactions')
    await assertTransactions(1)
    await page.reload()
    await assertTransactions(1)

    await navigate('/debts')
    await repay('2000')
    await page.getByRole('button', { name: /Settled/ }).click()
    await expect(page.getByText('Atome', { exact: true })).toBeVisible()
    await navigate('/dashboard')
    await assertDashboard('₱2,000.00', 20, '₱3,100', -55, 4)
    await navigate('/transactions')
    await assertTransactions(2)

    await navigate('/debts')
    await page.getByRole('button', { name: /Settled/ }).click()
    await page.getByRole('button', { name: 'History', exact: true }).click()
    history = page.getByRole('dialog', { name: 'Activity: Atome' })
    const finalPayment = history.getByRole('listitem').filter({ hasText: '-₱2,000.00' })
    await finalPayment.getByRole('button', { name: 'Reverse', exact: true }).click()
    await finalPayment.getByRole('button', { name: 'Confirm Reversal' }).click()
    await expect(finalPayment).toContainText('Reversed')
    await history.getByRole('button', { name: 'Close', exact: true }).click()
    await page.getByRole('button', { name: /Active/ }).click()
    await expect(page.getByRole('button', { name: 'Pay', exact: true })).toBeVisible()
    await navigate('/dashboard')
    await assertDashboard('₱4,000.00', 40, '₱1,100', 45, 3)
    await page.reload()
    await assertDashboard('₱4,000.00', 40, '₱1,100', 45, 3)
    await navigate('/transactions')
    await assertTransactions(1)
    expect(fixture.unexpectedRequests).toEqual([])
    expect(fixture.rpcCalls.map(call => call.name)).toEqual([
      'pay_debt_checked', 'pay_debt_checked', 'reverse_debt_payment_checked',
    ])
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

  test('navigates to /debts via the mobile dock, not the More sheet', async ({ page }, testInfo) => {
    test.skip(
      !testInfo.project.name.startsWith('Mobile'),
      'Mobile navigation uses mobile browser projects.',
    )

    await page.goto('/dashboard')
    const dock = page.getByRole('navigation', { name: 'Primary mobile navigation' })
    const debtsLink = dock.getByRole('link', { name: /Debts/i })
    await expect(debtsLink).toBeVisible()
    await debtsLink.click()

    await expect(page).toHaveURL(/\/debts$/)
    await expect(page.getByRole('heading', { level: 1, name: 'Debts' })).toBeVisible()
    await expect(debtsLink).toHaveAttribute('aria-current', 'page')

    await dock.getByRole('button', { name: 'Open more navigation' }).click()
    await expect(
      page.locator('#mobile-more-panel').getByRole('link', { name: /Debts/i }),
    ).toHaveCount(0)
  })
})
