import { fireEvent, screen, within } from '@testing-library/react'
import type userEvent from '@testing-library/user-event'

const tabNames: Record<string, RegExp> = {
  'Bank Card': /^Cards \d+$/,
  Cash: /^Cash$/,
  'E-Wallet': /^Wallets \d+$/,
  Lent: /^Lent \d+$/,
}

/** The account-type tab in the open picker sheet ("Cash", "Cards 2", …). */
export const sourceTab = (sheet: HTMLElement, method: string) =>
  within(within(sheet).getByRole('radiogroup', { name: 'Account type' })).getByRole('radio', {
    name: tabNames[method] ?? new RegExp(`^${method}`),
  })

export const openSheet = () => screen.getAllByRole('dialog').at(-1) as HTMLElement

/**
 * Drives the card-carousel picker synchronously: open the tile, pick the tab,
 * bring the account's card to the centre and press "Use …".
 */
export function chooseSourceSync(container: HTMLElement, tile: string, method: string, account?: string) {
  fireEvent.click(within(container).getByRole('button', { name: new RegExp(tile) }))
  const sheet = openSheet()
  fireEvent.click(sourceTab(sheet, method))
  if (account) {
    const card = within(sheet).getByRole('radio', { name: new RegExp(`^${account}`) })
    if (card.getAttribute('aria-checked') !== 'true') fireEvent.click(card)
  }
  fireEvent.click(within(sheet).getByRole('button', { name: /^Use / }))
}

/** The same steps with user-event, for specs that already use it. */
export async function chooseSource(
  user: ReturnType<typeof userEvent.setup>,
  container: HTMLElement,
  tile: string,
  method: string,
  account?: string,
) {
  await user.click(within(container).getByRole('button', { name: new RegExp(tile) }))
  const sheet = openSheet()
  await user.click(sourceTab(sheet, method))
  if (account) {
    const card = within(sheet).getByRole('radio', { name: new RegExp(`^${account}`) })
    if (card.getAttribute('aria-checked') !== 'true') await user.click(card)
  }
  await user.click(within(sheet).getByRole('button', { name: /^Use / }))
}
