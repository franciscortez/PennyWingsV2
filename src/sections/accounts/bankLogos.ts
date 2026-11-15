import type { Account } from '@/types'

import { getAccountCardDesign } from '@/sections/accounts/bankCardDesigns'

export type AccountLogo = {
  alt: string
  /** Logo file key: a `BankCardDesign.key`, or `wise`. */
  key: string
  src: string
}

/** Logo URLs keyed by file name, e.g. `maribank` -> `/assets/maribank-xxxx.svg`. */
const logoUrls: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('@/assets/bank-logos/*.svg', {
      eager: true,
      import: 'default',
      query: '?url',
    }),
  ).map(([path, url]) => [path.replace(/^.*\/(.+)\.svg$/, '$1'), url]),
)

/** Logos drawn in white or pale colors, which need a dark chip to stay visible. */
export const darkChipKeys: ReadonlySet<string> = new Set(['cimb', 'maya'])

const WISE_PATTERN = /\bwise\b/i

/**
 * Resolves the provider logo for a card or e-wallet account. Reuses the card
 * design detection (stored color, then wallet type, then name), with a name
 * fallback for Wise, which has a logo but no card design. Returns null when
 * the account has no provider or the provider has no logo file.
 */
export function getAccountLogo(
  account: Pick<Account, 'accountType' | 'color' | 'kind' | 'name'>,
): AccountLogo | null {
  if (account.kind !== 'card' && account.kind !== 'wallet') return null

  const design = getAccountCardDesign(account)
  const key = design?.key ?? (WISE_PATTERN.test(account.name) ? 'wise' : null)
  const src = key ? logoUrls[key] : undefined
  if (!key || !src) return null

  return { alt: design?.wordmark ?? 'Wise', key, src }
}
