import { expect, test } from '@playwright/test'
import { setupAuthenticatedMocks } from './helpers/authMock'

const viewports = [
  { name: 'Mobile (iPhone SE)', width: 375, height: 667 },
  { name: 'Mobile (Pixel 5)', width: 393, height: 851 },
  { name: 'Tablet (iPad Mini)', width: 768, height: 1024 },
  { name: 'Laptop (Desktop)', width: 1280, height: 800 },
  { name: 'Desktop (1080p)', width: 1920, height: 1080 },
]

test.describe('Responsive Layout & Viewport Overflow Audits', () => {
  for (const vp of viewports) {
    test.describe(`${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } })

      test.describe('Public Pages', () => {
        test('Landing Page (/) has no horizontal overflow', async ({ page }) => {
          await page.goto('/')
          await page.waitForLoadState('domcontentloaded')

          const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth
          })
          expect(hasOverflow).toBe(false)
        })

        test('Login Page (/login) has responsive container and visible controls', async ({
          page,
        }) => {
          await page.goto('/login')
          await page.waitForLoadState('domcontentloaded')

          const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth
          })
          expect(hasOverflow).toBe(false)

          const emailInput = page.locator('input[type="email"]')
          if (await emailInput.isVisible()) {
            const box = await emailInput.boundingBox()
            expect(box).not.toBeNull()
            if (box) {
              expect(box.width).toBeGreaterThan(150)
              expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 5)
            }
          }
        })

        test('Register Page (/signup) has responsive form fields', async ({ page }) => {
          await page.goto('/signup')
          await page.waitForLoadState('domcontentloaded')

          const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth
          })
          expect(hasOverflow).toBe(false)
        })

        test('Terms Page (/terms-and-conditions) text wraps cleanly without overflow', async ({
          page,
        }) => {
          await page.goto('/terms-and-conditions')
          await page.waitForLoadState('domcontentloaded')

          const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth
          })
          expect(hasOverflow).toBe(false)
        })
      })

      test.describe('Protected App Pages', () => {
        test.beforeEach(async ({ page }) => {
          await setupAuthenticatedMocks(page)
        })

        test('Dashboard Page (/dashboard) renders responsive layout without overflow', async ({
          page,
        }) => {
          await page.goto('/dashboard')
          await page.waitForLoadState('domcontentloaded')

          const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth
          })
          expect(hasOverflow).toBe(false)
        })

        test('Transactions Page (/transactions) renders responsive tables/cards', async ({
          page,
        }) => {
          await page.goto('/transactions')
          await page.waitForLoadState('domcontentloaded')

          const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth
          })
          expect(hasOverflow).toBe(false)
        })

        test('Accounts Page (/accounts) renders card/wallet grids cleanly', async ({
          page,
        }) => {
          await page.goto('/accounts')
          await page.waitForLoadState('domcontentloaded')

          const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth
          })
          expect(hasOverflow).toBe(false)
        })

        test('Reports Page (/reports) adapts to screen size without overflow', async ({
          page,
        }) => {
          await page.goto('/reports')
          await page.waitForLoadState('domcontentloaded')

          const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth
          })
          expect(hasOverflow).toBe(false)
        })

        test('Monitoring Page (/monitoring) adapts cleanly across viewports', async ({
          page,
        }) => {
          await page.goto('/monitoring')
          await page.waitForLoadState('domcontentloaded')

          const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth
          })
          expect(hasOverflow).toBe(false)
        })

        test('Profile Page (/profile) settings form fits within viewport', async ({
          page,
        }) => {
          await page.goto('/profile')
          await page.waitForLoadState('domcontentloaded')

          const hasOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth
          })
          expect(hasOverflow).toBe(false)
        })
      })
    })
  }
})
