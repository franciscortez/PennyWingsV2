import { BankCardFace } from '@/sections/accounts/BankCardFace'
import { MoneyNoteFace } from '@/sections/accounts/MoneyNoteFace'
import {
  buildCustomCardDesign,
  getAccountCardDesign,
  getNoteSerial,
} from '@/sections/accounts/bankCardDesigns'
import { formatAccountType, getAccountSubtitle } from '@/sections/accounts/accountLabels'
import type { Account } from '@/types'

/**
 * The account's artwork: its bank's card face (or a card built from its own
 * colour) for cards and wallets, a banknote for cash and lent money. Every
 * face sizes from its container width, so the same art works as a full card
 * or a thumbnail.
 */
export function AccountFace({
  account,
  className = 'aspect-[8/5] w-full',
}: {
  account: Account
  className?: string
}) {
  if (account.kind === 'card' || account.kind === 'wallet') {
    const design = getAccountCardDesign(account)
    const faceDesign =
      design ??
      buildCustomCardDesign(account.color || '#F472B6', account.textColor || '#ffffff')
    const numberLine =
      account.kind === 'card'
        ? `••••  ••••  ••••  ${account.lastFour || '••••'}`
        : account.accountIdentifier || '••••  ••••  ••••  ••••'

    return (
      <BankCardFace
        className={className}
        design={faceDesign}
        holderName={account.name}
        numberLine={numberLine}
        typeLabel={
          account.kind === 'wallet' ? 'Wallet' : formatAccountType(account.accountType)
        }
      />
    )
  }

  const variant = account.kind === 'lent' ? 'lent' : 'cash'
  return (
    <MoneyNoteFace
      className={className}
      serial={getNoteSerial(variant, account.id)}
      subtitle={getAccountSubtitle(account)}
      title={account.name}
      variant={variant}
    />
  )
}
