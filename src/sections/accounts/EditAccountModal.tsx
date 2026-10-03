import { useState } from 'react'
import type { FormEvent } from 'react'

import { AppButton } from '@/components/ui/Button'
import { fieldInput, fieldLabel, fieldError, fieldHint } from '@/components/ui/fieldStyles'
import { AccountColorChoices } from '@/sections/accounts/AccountColorChoices'
import { accountModalPanel, accountChoice, accountChoiceActive, accountChoiceIdle } from '@/sections/accounts/accountStyles'
import { ModalFrame } from '@/components/ui/ModalFrame'
import { BankCardFace } from '@/sections/accounts/BankCardFace'
import { MoneyNoteFace } from '@/sections/accounts/MoneyNoteFace'
import {
  buildCustomCardDesign,
  getAccountCardDesign,
  getNoteSerial,
  noteColors,
} from '@/sections/accounts/bankCardDesigns'
import { cardTypeOptions, walletTypeOptions } from '@/sections/accounts/accountOptions'
import type { Account, AccountUpdateValues } from '@/types'
import { accountUpdateSchema } from '@/validation/accountSchemas'

type EditAccountModalProps = {
  account: Account
  saving: boolean
  onClose: () => void
  onUpdate: (values: AccountUpdateValues) => Promise<boolean>
}

const textColorOptions = [
  { label: 'White', value: '#ffffff' },
  { label: 'Dark Slate', value: '#0f172a' },
  { label: 'Soft Pink', value: '#fce7f3' },
]

export function EditAccountModal({
  account,
  onClose,
  onUpdate,
  saving,
}: EditAccountModalProps) {
  const [name, setName] = useState(account.name)
  const [accountType, setAccountType] = useState(account.accountType)
  const [lastFour, setLastFour] = useState(account.lastFour ?? '')
  const [accountIdentifier, setAccountIdentifier] = useState(
    account.accountIdentifier ?? '',
  )
  const [color, setColor] = useState(account.color || '#F472B6')
  const [textColor, setTextColor] = useState(account.textColor || '#ffffff')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isCard = account.kind === 'card'
  const isDirectAccount = account.kind === 'cash' || account.kind === 'lent'
  const isBankCard = !isDirectAccount
  const detectedDesign = isBankCard
    ? getAccountCardDesign({ accountType, color, kind: account.kind, name })
    : null

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const rawValues: AccountUpdateValues = {
      accountIdentifier: isCard ? undefined : accountIdentifier,
      accountType: isDirectAccount ? account.kind : accountType,
      color: isDirectAccount
        ? noteColors[account.kind === 'lent' ? 'lent' : 'cash']
        : detectedDesign
          ? detectedDesign.primary
          : color,
      kind: account.kind,
      lastFour: isCard ? lastFour : undefined,
      name,
      textColor: isDirectAccount
        ? '#ffffff'
        : detectedDesign
          ? detectedDesign.text
          : textColor,
    }

    const validationResult = accountUpdateSchema.safeParse(rawValues)

    if (!validationResult.success) {
      const formattedErrors: Record<string, string> = {}

      for (const issue of validationResult.error.issues) {
        const fieldName = issue.path[0]
        if (typeof fieldName === 'string' && !formattedErrors[fieldName]) {
          formattedErrors[fieldName] = issue.message
        }
      }

      setErrors(formattedErrors)
      return
    }

    setErrors({})
    await onUpdate(validationResult.data as AccountUpdateValues)
  }

  const formId = 'edit-account-form'

  return (
    <ModalFrame
      actions={
        <div className="flex flex-wrap items-center justify-end gap-3">
          <AppButton
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
            className="min-w-0 whitespace-normal"
          >
            Cancel
          </AppButton>
          <AppButton
            type="submit"
            form={formId}
            disabled={saving}
            className="min-w-0 whitespace-normal"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </AppButton>
        </div>
      }
      backdrop="none"
      closeDisabled={saving}
      closeLabel="Close edit account"
      description="Update account preferences and details"
      onClose={onClose}
      overlayClassName="z-50 bg-slate-950/60"
      panelClassName={`${accountModalPanel} max-w-lg`}
      title="Edit Account"
      titleId="edit-account-title"
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        {/* Account Name */}
        <div>
          <label
            htmlFor="account-name-input"
            className={`mb-2 block ${fieldLabel}`}
          >
            Account Name
          </label>
          <input
            id="account-name-input"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'account-name-input-error' : undefined}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldInput(false, "min-w-0")}
            placeholder="e.g. BDO Savings, GCash"
          />
          {errors.name ? (
            <p id="account-name-input-error" className={fieldError}>{errors.name}</p>
          ) : null}
        </div>

        {/* Account Type */}
        {!isDirectAccount ? (
          <div>
            <label
              htmlFor="account-type-select"
              className={`mb-2 block ${fieldLabel}`}
            >
              Account Type
            </label>
            <select
              id="account-type-select"
              aria-invalid={Boolean(errors.accountType)}
              aria-describedby={errors.accountType ? 'account-type-select-error' : undefined}
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className={fieldInput(false, "min-w-0")}
            >
              {(isCard ? cardTypeOptions : walletTypeOptions).map((option) => (
                <option key={option.value} value={option.value} className="dark:bg-slate-900">
                  {option.label}
                </option>
              ))}
            </select>
            {errors.accountType ? (
              <p id="account-type-select-error" className={fieldError}>
                {errors.accountType}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Card Suffix / Wallet Identifier */}
        {isCard ? (
          <div>
            <label
              htmlFor="last-four-input"
              className={`mb-2 block ${fieldLabel}`}
            >
              Card Last 4 Digits (Optional)
            </label>
            <input
              id="last-four-input"
              aria-invalid={Boolean(errors.lastFour)}
              aria-describedby={errors.lastFour ? 'last-four-input-error' : undefined}
              type="text"
              maxLength={4}
              value={lastFour}
              onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ''))}
              className={fieldInput(false, "min-w-0")}
              placeholder="1234"
            />
            {errors.lastFour ? (
              <p id="last-four-input-error" className={fieldError}>
                {errors.lastFour}
              </p>
            ) : null}
          </div>
        ) : !isDirectAccount ? (
          <div>
            <label
              htmlFor="account-identifier-input"
              className={`mb-2 block ${fieldLabel}`}
            >
              Account Identifier (Optional)
            </label>
            <input
              id="account-identifier-input"
              aria-invalid={Boolean(errors.accountIdentifier)}
              aria-describedby={errors.accountIdentifier ? 'account-identifier-input-error' : undefined}
              type="text"
              value={accountIdentifier}
              onChange={(e) => setAccountIdentifier(e.target.value)}
              className={fieldInput(false, "min-w-0")}
              placeholder="Mobile number or account ID"
            />
            {errors.accountIdentifier ? (
              <p id="account-identifier-input-error" className={fieldError}>
                {errors.accountIdentifier}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Live card preview */}
        {isBankCard ? (
          <div>
            <label className={`mb-2 block ${fieldLabel}`}>
              {detectedDesign ? 'Official Card Design' : 'Card Preview'}
            </label>
            <div data-account-artwork>
              <BankCardFace
                className="aspect-[8/5] w-full"
                design={detectedDesign ?? buildCustomCardDesign(color, textColor)}
                holderName={name}
                numberLine={
                  isCard
                    ? `••••  ••••  ••••  ${lastFour || '••••'}`
                    : accountIdentifier || '••••  ••••  ••••  ••••'
                }
                typeLabel={
                  isCard
                    ? accountType.charAt(0).toUpperCase() + accountType.slice(1)
                    : 'Wallet'
                }
              />
            </div>
            {detectedDesign ? (
              <p className={fieldHint}>
                This account uses {detectedDesign.wordmark}&rsquo;s official
                card design, so no color selection is needed.
              </p>
            ) : null}
          </div>
        ) : (
          <div>
            <label className={`mb-2 block ${fieldLabel}`}>
              Note Preview
            </label>
            <div data-account-artwork>
              <MoneyNoteFace
                className="aspect-[8/5] w-full"
                serial={getNoteSerial(
                  account.kind === 'lent' ? 'lent' : 'cash',
                  account.id,
                )}
                subtitle={
                  account.kind === 'lent' ? 'Money lent out' : 'Cash on hand'
                }
                title={name}
                variant={account.kind === 'lent' ? 'lent' : 'cash'}
              />
            </div>
            <p className={fieldHint}>
              {account.kind === 'lent' ? 'Lent money' : 'Cash'} accounts use
              this fixed banknote design, so no color selection is needed.
            </p>
          </div>
        )}

        {!detectedDesign && !isDirectAccount ? (
          <AccountColorChoices
            label="Account Card Theme"
            value={color}
            onChange={option => {
              setColor(option.value)
              if (option.text) setTextColor(option.text)
            }}
          />
        ) : null}

        {/* Text Color Selection */}
        {!detectedDesign && !isDirectAccount ? (
        <fieldset className="min-w-0">
          <legend className={`mb-2 block ${fieldLabel}`}>
            Card Text Color
          </legend>
          <div className="flex flex-wrap gap-3">
            {textColorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTextColor(option.value)}
                aria-pressed={textColor.toLowerCase() === option.value.toLowerCase()}
                className={`${accountChoice} flex items-center gap-2 ${textColor.toLowerCase() === option.value.toLowerCase() ? accountChoiceActive : accountChoiceIdle}`}
              >
                <span
                  className="h-3 w-3 rounded-full border border-gray-300 dark:border-slate-700"
                  style={{ backgroundColor: option.value }}
                />
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
        ) : null}

      </form>
    </ModalFrame>
  )
}
