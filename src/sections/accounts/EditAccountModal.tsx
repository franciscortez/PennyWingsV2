import { FaCheck } from 'react-icons/fa6'
import { useState } from 'react'
import type { FormEvent } from 'react'

import { ModalFrame } from '@/components/ui/ModalFrame'
import { BankCardFace } from '@/sections/accounts/BankCardFace'
import { MoneyNoteFace } from '@/sections/accounts/MoneyNoteFace'
import {
  buildCustomCardDesign,
  getAccountCardDesign,
  getNoteSerial,
  noteColors,
} from '@/sections/accounts/bankCardDesigns'
import { accountColors, cardTypeOptions, walletTypeOptions } from '@/sections/accounts/accountOptions'
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
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-2xl border border-gray-200 px-6 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 dark:border-slate-750 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-2xl bg-pink-500 px-8 py-3 text-sm font-bold text-white transition hover:bg-pink-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      }
      backdrop="none"
      closeDisabled={saving}
      closeLabel="Close edit account"
      description="Update account preferences and details"
      onClose={onClose}
      overlayClassName="z-50 bg-gray-900/60 backdrop-blur-sm"
      panelClassName="max-w-lg rounded-[2.5rem] border-0 shadow-2xl dark:border dark:border-slate-800 dark:shadow-none"
      title="Edit Account"
      titleId="edit-account-title"
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        {/* Account Name */}
        <div>
          <label
            htmlFor="account-name-input"
            className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500"
          >
            Account Name
          </label>
          <input
            id="account-name-input"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-pink-100 bg-pink-50/30 px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:focus:border-pink-500"
            placeholder="e.g. BDO Savings, GCash"
          />
          {errors.name ? (
            <p className="mt-1 text-xs font-bold text-red-500">{errors.name}</p>
          ) : null}
        </div>

        {/* Account Type */}
        {!isDirectAccount ? (
          <div>
            <label
              htmlFor="account-type-select"
              className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500"
            >
              Account Type
            </label>
            <select
              id="account-type-select"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="w-full rounded-2xl border border-pink-100 bg-pink-50/30 px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:focus:border-pink-500"
            >
              {(isCard ? cardTypeOptions : walletTypeOptions).map((option) => (
                <option key={option.value} value={option.value} className="dark:bg-slate-900">
                  {option.label}
                </option>
              ))}
            </select>
            {errors.accountType ? (
              <p className="mt-1 text-xs font-bold text-red-500">
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
              className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500"
            >
              Card Last 4 Digits (Optional)
            </label>
            <input
              id="last-four-input"
              type="text"
              maxLength={4}
              value={lastFour}
              onChange={(e) => setLastFour(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-2xl border border-pink-100 bg-pink-50/30 px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:focus:border-pink-500"
              placeholder="1234"
            />
            {errors.lastFour ? (
              <p className="mt-1 text-xs font-bold text-red-500">
                {errors.lastFour}
              </p>
            ) : null}
          </div>
        ) : !isDirectAccount ? (
          <div>
            <label
              htmlFor="account-identifier-input"
              className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500"
            >
              Account Identifier (Optional)
            </label>
            <input
              id="account-identifier-input"
              type="text"
              value={accountIdentifier}
              onChange={(e) => setAccountIdentifier(e.target.value)}
              className="w-full rounded-2xl border border-pink-100 bg-pink-50/30 px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200 dark:focus:border-pink-500"
              placeholder="Mobile number or account ID"
            />
            {errors.accountIdentifier ? (
              <p className="mt-1 text-xs font-bold text-red-500">
                {errors.accountIdentifier}
              </p>
            ) : null}
          </div>
        ) : null}

        {/* Live card preview */}
        {isBankCard ? (
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500">
              {detectedDesign ? 'Official Card Design' : 'Card Preview'}
            </label>
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
            {detectedDesign ? (
              <p className="mt-2 text-xs font-medium text-gray-400 dark:text-slate-500">
                This account uses {detectedDesign.wordmark}&rsquo;s official
                card design, so no color selection is needed.
              </p>
            ) : null}
          </div>
        ) : (
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500">
              Note Preview
            </label>
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
            <p className="mt-2 text-xs font-medium text-gray-400 dark:text-slate-500">
              {account.kind === 'lent' ? 'Lent money' : 'Cash'} accounts use
              this fixed banknote design, so no color selection is needed.
            </p>
          </div>
        )}

        {/* Card Color Palette */}
        {!detectedDesign && !isDirectAccount ? (
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500">
            Account Card Theme
          </label>
          <div className="grid grid-cols-8 gap-2">
            {accountColors.map((colorOption) => (
              <button
                key={colorOption.value}
                type="button"
                onClick={() => {
                  setColor(colorOption.value)
                  if (colorOption.text) {
                    setTextColor(colorOption.text)
                  }
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-transform ${colorOption.background} ${
                  color === colorOption.value ? 'scale-110 ring-4 ring-pink-500/30' : 'hover:scale-105'
                }`}
              >
                {color === colorOption.value ? (
                  <FaCheck
                    className="h-4 w-4"
                    style={{ color: colorOption.text || '#ffffff' }}
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            ))}
          </div>
        </div>
        ) : null}

        {/* Text Color Selection */}
        {!detectedDesign && !isDirectAccount ? (
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-500">
            Card Text Color
          </label>
          <div className="flex gap-3">
            {textColorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTextColor(option.value)}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-xs font-bold transition-all ${
                  textColor === option.value
                    ? 'border-pink-500 bg-pink-50 text-pink-600 dark:border-pink-600 dark:bg-pink-950/20 dark:text-pink-400'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-pink-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <span
                  className="h-3 w-3 rounded-full border border-gray-300 dark:border-slate-700"
                  style={{ backgroundColor: option.value }}
                />
                {option.label}
              </button>
            ))}
          </div>
        </div>
        ) : null}

      </form>
    </ModalFrame>
  )
}
