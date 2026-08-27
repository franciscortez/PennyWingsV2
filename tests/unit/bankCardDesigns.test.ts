import { describe, expect, it } from 'vitest'

import {
  accountColors,
  digitalBankOptions,
  eWalletProviderOptions,
  traditionalBankOptions,
} from '@/sections/accounts/accountOptions'
import {
  bankCardDesigns,
  buildCustomCardDesign,
  getAccountCardDesign,
  getDesignForProvider,
} from '@/sections/accounts/bankCardDesigns'

const namedProviders = [
  ...traditionalBankOptions,
  ...digitalBankOptions,
  ...eWalletProviderOptions,
].filter((provider) => provider !== 'Others')

describe('getDesignForProvider', () => {
  it.each(namedProviders)('resolves an official design for %s', (provider) => {
    expect(getDesignForProvider(provider)).not.toBeNull()
  })

  it('returns null for Others and empty values', () => {
    expect(getDesignForProvider('Others')).toBeNull()
    expect(getDesignForProvider('Other')).toBeNull()
    expect(getDesignForProvider('')).toBeNull()
    expect(getDesignForProvider('My Piggy Bank')).toBeNull()
  })

  it('resolves wallet type values used as accountType', () => {
    expect(getDesignForProvider('gcash')?.key).toBe('gcash')
    expect(getDesignForProvider('maya')?.key).toBe('maya')
    expect(getDesignForProvider('grabpay')?.key).toBe('grabpay')
    expect(getDesignForProvider('paypal')?.key).toBe('paypal')
  })

  it('does not confuse similar names', () => {
    expect(getDesignForProvider('Unionbank')?.key).toBe('unionbank')
    expect(getDesignForProvider('Uno Bank')?.key).toBe('uno')
    expect(getDesignForProvider('Maribank')?.key).toBe('maribank')
    expect(getDesignForProvider('Maya')?.key).toBe('maya')
  })
})

describe('getAccountCardDesign', () => {
  it('matches by persisted brand color even after a rename', () => {
    const design = getDesignForProvider('BDO')
    expect(design).not.toBeNull()
    expect(
      getAccountCardDesign({
        accountType: 'savings',
        color: design!.primary,
        kind: 'card',
        name: 'My Renamed Fund',
      })?.key,
    ).toBe('bdo')
  })

  it('matches wallets by accountType', () => {
    expect(
      getAccountCardDesign({
        accountType: 'gcash',
        color: '#F472B6',
        kind: 'wallet',
        name: 'Daily Spend',
      })?.key,
    ).toBe('gcash')
  })

  it('matches legacy accounts by name', () => {
    expect(
      getAccountCardDesign({
        accountType: 'savings',
        color: '#F472B6',
        kind: 'card',
        name: 'BPI Savings',
      })?.key,
    ).toBe('bpi')
  })

  it('returns null for cash, lent, and custom accounts', () => {
    expect(
      getAccountCardDesign({
        accountType: 'cash',
        color: '#F472B6',
        kind: 'cash',
        name: 'Cash on Hand',
      }),
    ).toBeNull()
    expect(
      getAccountCardDesign({
        accountType: 'savings',
        color: '#F472B6',
        kind: 'card',
        name: 'Emergency Fund',
      }),
    ).toBeNull()
  })
})

describe('design registry integrity', () => {
  it('uses a unique primary color per design', () => {
    const primaries = bankCardDesigns.map((design) =>
      design.primary.toLowerCase(),
    )
    expect(new Set(primaries).size).toBe(primaries.length)
  })

  it('never collides with the custom color palette', () => {
    const paletteValues = new Set(
      accountColors.map((color) => color.value.toLowerCase()),
    )
    for (const design of bankCardDesigns) {
      expect(paletteValues.has(design.primary.toLowerCase())).toBe(false)
    }
  })
})

describe('buildCustomCardDesign', () => {
  it('keeps the picked color as primary and builds a gradient', () => {
    const design = buildCustomCardDesign('#F472B6', '#ffffff')
    expect(design.primary).toBe('#F472B6')
    expect(design.text).toBe('#ffffff')
    expect(design.background).toContain('linear-gradient')
    expect(design.wordmark).toBe('')
  })
})
