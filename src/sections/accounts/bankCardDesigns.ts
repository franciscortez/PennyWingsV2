import type { Account } from '@/types'

/** Decorative face pattern mimicking the artwork on the bank's physical card. */
export type BankCardMotif = 'arc' | 'circles' | 'glow' | 'minimal' | 'waves'

export type BankCardDesign = {
  /** Brand accent used for contactless icon, type label, and decorative glow. */
  accent: string
  /** Full card-face gradient matching the bank's physical card. */
  background: string
  key: string
  /** Matches provider names, wallet types, and account names (lowercased). */
  match: RegExp
  motif: BankCardMotif
  /** Brand primary color — persisted to the `color` column and used for reverse lookup. */
  primary: string
  /** Text color persisted to the `text_color` column. */
  text: string
  /** Bank wordmark rendered on the card face. */
  wordmark: string
  /** Optional wordmark color when it differs from the card text color. */
  wordmarkColor?: string
}

/**
 * Pre-set card designs modeled after each provider's official card colors.
 * Order matters: the first matching entry wins.
 */
export const bankCardDesigns: BankCardDesign[] = [
  {
    accent: '#8FB8E8',
    background: 'linear-gradient(135deg, #0F55B0 0%, #08337A 55%, #041F4E 100%)',
    key: 'bdo',
    match: /\bbdo\b|banco de oro/,
    motif: 'arc',
    primary: '#08337A',
    text: '#ffffff',
    wordmark: 'BDO',
  },
  {
    accent: '#F2C14E',
    background: 'linear-gradient(135deg, #C8161C 0%, #9E1014 55%, #660A0D 100%)',
    key: 'bpi',
    match: /\bbpi\b|bank of the philippine islands/,
    motif: 'arc',
    primary: '#9E1014',
    text: '#ffffff',
    wordmark: 'BPI',
  },
  {
    accent: '#7FC4FD',
    background: 'linear-gradient(135deg, #0072CE 0%, #00509E 55%, #003672 100%)',
    key: 'metrobank',
    match: /metro\s*bank/,
    motif: 'waves',
    primary: '#00509E',
    text: '#ffffff',
    wordmark: 'Metrobank',
  },
  {
    accent: '#FFD9A8',
    background: 'linear-gradient(135deg, #FF9E2C 0%, #F58220 50%, #D8620E 100%)',
    key: 'unionbank',
    match: /union\s*bank/,
    motif: 'arc',
    primary: '#F58220',
    text: '#ffffff',
    wordmark: 'UnionBank',
  },
  {
    accent: '#7CD9B4',
    background: 'linear-gradient(135deg, #00875A 0%, #00623F 55%, #00402A 100%)',
    key: 'securitybank',
    match: /security\s*bank/,
    motif: 'arc',
    primary: '#00623F',
    text: '#ffffff',
    wordmark: 'Security Bank',
  },
  {
    accent: '#93CDF2',
    background: 'linear-gradient(135deg, #0077C8 0%, #005696 55%, #003864 100%)',
    key: 'pnb',
    match: /\bpnb\b|philippine national bank/,
    motif: 'waves',
    primary: '#005696',
    text: '#ffffff',
    wordmark: 'PNB',
  },
  {
    accent: '#F7A823',
    background: 'linear-gradient(135deg, #009A44 0%, #00702F 55%, #004D20 100%)',
    key: 'landbank',
    match: /land\s*bank/,
    motif: 'arc',
    primary: '#00702F',
    text: '#ffffff',
    wordmark: 'LANDBANK',
  },
  {
    accent: '#29D67D',
    background: 'linear-gradient(135deg, #17171C 0%, #0E0E12 55%, #050507 100%)',
    key: 'maya',
    match: /\bmaya\b|pay\s*maya/,
    motif: 'glow',
    primary: '#0E0E12',
    text: '#ffffff',
    wordmark: 'maya',
  },
  {
    accent: '#00E5CF',
    background: 'linear-gradient(135deg, #0A2A3D 0%, #071D2B 55%, #04121C 100%)',
    key: 'gotyme',
    match: /go\s*tyme/,
    motif: 'glow',
    primary: '#071D2B',
    text: '#ffffff',
    wordmark: 'GoTyme',
    wordmarkColor: '#00E5CF',
  },
  {
    accent: '#FFD1B8',
    background: 'linear-gradient(135deg, #FF7337 0%, #EE4D2D 50%, #C43C1B 100%)',
    key: 'maribank',
    match: /mari\s*bank|sea\s*bank/,
    motif: 'arc',
    primary: '#EE4D2D',
    text: '#ffffff',
    wordmark: 'MariBank',
  },
  {
    accent: '#FFDE59',
    background: 'linear-gradient(135deg, #6F3AD6 0%, #4E22A8 55%, #32156E 100%)',
    key: 'tonik',
    match: /tonik/,
    motif: 'glow',
    primary: '#4E22A8',
    text: '#ffffff',
    wordmark: 'Tonik',
  },
  {
    accent: '#F9A8AE',
    background: 'linear-gradient(135deg, #EC1C2E 0%, #B5121F 55%, #7C0C15 100%)',
    key: 'cimb',
    match: /\bcimb\b/,
    motif: 'arc',
    primary: '#B5121F',
    text: '#ffffff',
    wordmark: 'CIMB',
  },
  {
    accent: '#FFD34D',
    background: 'linear-gradient(135deg, #00B5E6 0%, #6C4BD3 55%, #B03BC4 100%)',
    key: 'uno',
    match: /\buno\b/,
    motif: 'minimal',
    primary: '#6C4BD3',
    text: '#ffffff',
    wordmark: 'UNO',
  },
  {
    accent: '#AAD6FF',
    background: 'linear-gradient(135deg, #2E9BFF 0%, #007DFE 50%, #0053C0 100%)',
    key: 'gcash',
    match: /g\s*cash/,
    motif: 'circles',
    primary: '#007DFE',
    text: '#ffffff',
    wordmark: 'GCash',
  },
  {
    accent: '#A9EEC6',
    background: 'linear-gradient(135deg, #00C25B 0%, #00B14F 50%, #007A37 100%)',
    key: 'grabpay',
    match: /grab\s*pay/,
    motif: 'circles',
    primary: '#00B14F',
    text: '#ffffff',
    wordmark: 'GrabPay',
  },
  {
    accent: '#7BD2F6',
    background: 'linear-gradient(135deg, #0070BA 0%, #00459C 55%, #012F73 100%)',
    key: 'paypal',
    match: /pay\s*pal/,
    motif: 'minimal',
    primary: '#00459C',
    text: '#ffffff',
    wordmark: 'PayPal',
  },
]

const HEX_PATTERN = /^#[0-9a-f]{6}$/i

export function adjustColorBrightness(hex: string, amount: number): string {
  if (!HEX_PATTERN.test(hex)) return hex

  const num = parseInt(hex.slice(1), 16)
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount))
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount))
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

/** Looks up the official design for a provider label or wallet type. */
export function getDesignForProvider(provider: string): BankCardDesign | null {
  const value = provider.trim().toLowerCase()
  if (!value || value === 'others' || value === 'other') return null

  return bankCardDesigns.find((design) => design.match.test(value)) ?? null
}

/**
 * Resolves the official design for an existing account. Detection tries the
 * persisted brand color first (survives renames), then the wallet type, then
 * the account name — so accounts created before designs existed still match.
 */
export function getAccountCardDesign(
  account: Pick<Account, 'accountType' | 'color' | 'kind' | 'name'>,
): BankCardDesign | null {
  if (account.kind !== 'card' && account.kind !== 'wallet') return null

  const storedColor = account.color?.toLowerCase()
  const byColor = bankCardDesigns.find(
    (design) => design.primary.toLowerCase() === storedColor,
  )
  if (byColor) return byColor

  if (account.kind === 'wallet') {
    const byType = getDesignForProvider(account.accountType)
    if (byType) return byType
  }

  return getDesignForProvider(account.name)
}

/**
 * Fixed banknote ink per note kind — cash and lent notes have one design
 * each, so no color is selectable. Persisted to the `color` column and used
 * wherever the account color is shown.
 */
export const noteColors: Record<'cash' | 'lent', string> = {
  cash: '#0E8C52',
  lent: '#B45309',
}

/** Stable banknote serial derived from the account id, e.g. "PW 3F82A1C4". */
export const getNoteSerial = (kind: 'cash' | 'lent', id: string) =>
  `${kind === 'lent' ? 'IOU' : 'PW'} ${
    id
      .replace(/[^a-z0-9]/gi, '')
      .slice(0, 8)
      .toUpperCase() || '00000000'
  }`

/** Builds a real-card look from a user-picked color for "Others" accounts. */
export function buildCustomCardDesign(
  color: string,
  textColor: string,
): BankCardDesign {
  return {
    accent: adjustColorBrightness(color, 70),
    background: `linear-gradient(135deg, ${adjustColorBrightness(color, 26)} 0%, ${color} 45%, ${adjustColorBrightness(color, -54)} 100%)`,
    key: 'custom',
    match: /$^/,
    motif: 'arc',
    primary: color,
    text: textColor,
    wordmark: '',
  }
}
