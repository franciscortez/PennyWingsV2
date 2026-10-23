import { expect, test } from '@playwright/test'
import { createServer, request } from 'node:http'
import type { AddressInfo } from 'node:net'

test('built worker serves only a public fallback and retry retains the requested URL', async ({ page, context }) => {
  let connected = true
  // WebKit's setOffline rejects even worker-supplied navigations (Playwright #42775).
  // Break the actual local origin connection instead, exercising the shipped worker.
  const origin = createServer((incoming, outgoing) => {
    if (!connected) { incoming.socket.destroy(); return }
    if (incoming.url === '/server-error') { outgoing.writeHead(503); outgoing.end('Server unavailable'); return }
    const upstream = request(`http://127.0.0.1:4175${incoming.url}`, (response) => {
      outgoing.writeHead(response.statusCode ?? 502, response.headers)
      response.pipe(outgoing)
    })
    upstream.on('error', () => { outgoing.writeHead(502); outgoing.end() })
    upstream.end()
  })
  await new Promise<void>((resolve) => origin.listen(0, '127.0.0.1', resolve))
  const base = `http://127.0.0.1:${(origin.address() as AddressInfo).port}`
  try {
  await context.route('https://**/*', (route) => route.abort())
  await page.goto(`${base}/forgot-password`)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true)
  const requested = '/transactions?type=expense&page=2'
  connected = false
  await page.goto(base + requested)
  await expect(page.getByRole('heading', { name: 'Let’s reconnect.' })).toBeVisible()
  expect(new URL(page.url()).pathname + new URL(page.url()).search).toBe(requested)
  const cached = await page.evaluate(async () => {
    const keys = (await caches.keys()).filter((key) => key.startsWith('pennywings-offline-'))
    return Promise.all(keys.map(async (key) => (await (await caches.open(key)).keys()).map((request) => new URL(request.url).pathname)))
  })
  expect(cached).toEqual([['/offline.html']])
  connected = true
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { name: 'Let’s reconnect.' })).toHaveCount(0)
  expect(await page.evaluate(() => sessionStorage.getItem('pennywings:return'))).toBe(requested)
  const response = await page.goto(`${base}/server-error`)
  expect(response?.status()).toBe(503)
  await expect(page.locator('body')).toHaveText('Server unavailable')
  } finally {
    origin.closeAllConnections()
    await new Promise<void>((resolve) => origin.close(() => resolve()))
  }
})
