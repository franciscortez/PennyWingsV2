import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const read = (file: string) => readFileSync(path.resolve(process.cwd(), file), 'utf8')

const inlineScriptHashes = (html: string) =>
  [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(
    ([, body]) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`,
  )

type HeaderRule = { source: string; headers: { key: string; value: string }[] }

const reportOnlyPolicy = () => {
  const { headers } = JSON.parse(read('vercel.json')) as { headers: HeaderRule[] }
  const rule = headers.find((entry) => entry.source === '/(.*)')
  const header = rule?.headers.find((entry) => entry.key === 'Content-Security-Policy-Report-Only')

  return header?.value ?? ''
}

const directive = (policy: string, name: string) =>
  policy
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name} `)) ?? ''

describe('report-only Content-Security-Policy', () => {
  it('is sent for every route as report-only', () => {
    expect(reportOnlyPolicy()).not.toBe('')
  })

  // An edit to an inline script silently invalidates its hash. This fails
  // until vercel.json is updated, instead of surfacing as a console report.
  it.each(['index.html', 'public/offline.html'])('allows every inline script in %s by hash', (file) => {
    const scriptSrc = directive(reportOnlyPolicy(), 'script-src')
    const hashes = inlineScriptHashes(read(file))

    expect(hashes.length).toBeGreaterThan(0)

    for (const hash of hashes) {
      expect(scriptSrc).toContain(hash)
    }
  })

  it('does not weaken script-src or open framing and plugins', () => {
    const policy = reportOnlyPolicy()

    expect(directive(policy, 'script-src')).not.toMatch(/unsafe-inline|unsafe-eval/)
    expect(directive(policy, 'object-src')).toBe("object-src 'none'")
    expect(directive(policy, 'frame-ancestors')).toBe("frame-ancestors 'none'")
    expect(directive(policy, 'base-uri')).toBe("base-uri 'self'")
  })

  it('allows the Supabase API origin for fetches', () => {
    expect(directive(reportOnlyPolicy(), 'connect-src')).toContain('https://*.supabase.co')
  })
})

describe('document metadata', () => {
  const html = read('index.html')

  it('describes the page for search and sharing', () => {
    expect(html).toMatch(/<meta name="description" content="[^"]{40,}"/)
    expect(html).toContain('<meta property="og:title" content="PennyWings" />')
    expect(html).toContain('<meta property="og:type" content="website" />')
  })

  it('builds og:image from the configurable site origin', () => {
    expect(html).toContain('content="%VITE_SITE_URL%/pennywings-butterfly-transparent.png"')
  })
})
